import {useRoundTransition} from '../../../hooks/useRoundTransition';
import React, { useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { useGameState } from '../../../hooks/useGameState';
import { useSafeCountdown } from '../../../hooks/useSafeCountdown';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { getNextUnplayedJudgeCase } from '../../../data/judgePredicaments';
import { evaluateAllExcuses } from '../../../services/judgeEngine';
import { createInitialJudgeState, savePersistedJudgeState, getRankedJudgeContestants } from './judgeSync';
import { openJudgeReading, acceptJudgeVote, publicJudgeState, scoreJudgeParty } from './judgeParty';
import { JudgePartyStage } from './components/JudgePartyStage';
import { JudgeFinalPodium } from './components/JudgeFinalPodium';
import type { JudgeRoomState } from './types';

export const JudgeTVRoot:React.FC<{mobileContestants?:Array<{id:string;name:string}>}>=({mobileContestants})=>{
  const {code='SHBH'}=useParams<{code:string}>();
  const roomCode=code.trim().toUpperCase();
  const {room}=useRoom(roomCode);
  const {connectedPlayers,hasPresenceSnapshot}=useRoomSync({roomCode:mobileContestants?'':roomCode,role:'host'});
  const members=mobileContestants ?? (hasPresenceSnapshot?connectedPlayers:(room?.players || []).filter(p=>p.id!=='host_tv'));
  const membersRef=useRef(members);membersRef.current=members;
  const [state,setState,snapshot]=useGameState<JudgeRoomState>(()=>createInitialJudgeState(roomCode));
  const defenseSeconds=useSafeCountdown(state.phase==='defending' ? state.defenseEndsAt : undefined);
  const analysisKey=useRef('');
  const generation=useRef(0);
  const sync=useCallback((next:JudgeRoomState)=>{
    setState(next);
    savePersistedJudgeState(roomCode,next);
    roomBus.broadcastJudgeSync(roomCode,publicJudgeState(next));
  },[roomCode,setState]);

  const startRound=useCallback((fresh=false)=>{
    const cur=snapshot.current;
    if (!fresh && cur.phase!=='COURTROOM_VERDICT') return;
    if (fresh && cur.phase!=='LOBBY') return;
    if (!fresh && cur.roundNumber>=cur.totalRounds) {sync({...cur,phase:'PODIUM'});return;}
    ++generation.current;analysisKey.current='';
    const predicament=fresh?cur.currentPredicament:getNextUnplayedJudgeCase(cur.usedPredicamentIds);
    sync({...cur,phase:'case_briefing',roundNumber:fresh?1:cur.roundNumber+1,currentPredicament:predicament,
      usedPredicamentIds:fresh?[predicament.id]:[...cur.usedPredicamentIds,predicament.id],briefingEndsAt:Date.now()+6000,
      defenseEndsAt:undefined,timerSeconds:40,excuses:{},submittedPlayerIds:[],verdicts:{},verdictList:[],
      party:undefined,revealState:'anonymous',readyPlayersNextRound:[]});
  },[sync,snapshot]);

  useRoundTransition(state.phase==='COURTROOM_VERDICT'?'COURTROOM_VERDICT:'+state.roundNumber:null,state.roundTransition,
    roundTransition=>sync({...snapshot.current,roundTransition}),()=>startRound());
  const startWriting=useCallback(()=>{
    const cur=snapshot.current;if(cur.phase!=='case_briefing') return;
    sync({...cur,phase:'defending',timerSeconds:40,defenseEndsAt:Date.now()+40000});
  },[sync,snapshot]);

  const closeWriting=useCallback(()=>{
    const cur=snapshot.current;if(cur.phase!=='defending') return;
    const people=new Map(membersRef.current.map(p=>[p.id,{id:p.id,name:p.name}]));
    Object.values(cur.excuses).forEach(e=>people.set(e.playerId,{id:e.playerId,name:e.playerName}));
    const next=openJudgeReading(cur,[...people.values()]);
    if(!next.party?.cards.length) next.phase='JUDGING';
    sync(next);
  },[sync,snapshot]);

  const advanceReading=useCallback(()=>{
    const cur=snapshot.current;const party=cur.party;
    if(cur.phase!=='READING' || !party) return;
    if(party.readIndex+1<party.cards.length) {
      sync({...cur,party:{...party,readIndex:party.readIndex+1,phaseEndsAt:Date.now()+8000}});
    } else sync({...cur,phase:party.mode==='jury' && party.cards.length>1?'VOTING':party.mode==='jury' && party.eligibleVoterIds.length?'VOTING':'JUDGING',
      party:{...party,phaseEndsAt:Date.now()+28000}});
  },[sync,snapshot]);

  useEffect(()=>{
    const offState=roomBus.on('REQUEST_ROOM_STATE',()=>roomBus.broadcastJudgeSync(roomCode,publicJudgeState(snapshot.current)),roomCode);
    const offStart=roomBus.on('GAME_STARTED',()=>startRound(true),roomCode);
    const offLobby=roomBus.on('RETURN_TO_LOBBY',()=>{
      ++generation.current;analysisKey.current='';sync(createInitialJudgeState(roomCode,true));
    },roomCode);
    const offSubmit=roomBus.on('JUDGE_SUBMIT_EXCUSE',event=>{
      const p=event.data,cur=snapshot.current;
      const member=membersRef.current.find(c=>c.id===p?.playerId);
      if(!member || cur.phase!=='defending' || p.roundNumber!==cur.roundNumber || p.caseId!==cur.currentPredicament.id ||
        typeof p.excuse!=='string' || p.excuse.length>140 || typeof p.cardId!=='string' || !/^[a-f0-9]{24}$/.test(p.cardId) ||
        Object.hasOwn(cur.excuses,p.playerId) || Object.values(cur.excuses).some(e=>e.cardId===p.cardId)) return;
      sync({...cur,excuses:{...cur.excuses,[p.playerId]:{playerId:p.playerId,playerName:member.name,excuse:p.excuse.trim(),cardId:p.cardId,submittedAt:Date.now()}}});
    },roomCode);
    const offVote=roomBus.on('JUDGE_PARTY_VOTE',event=>{
      const next=acceptJudgeVote(snapshot.current,event.data,membersRef.current.map(p=>p.id));
      if(next!==snapshot.current) sync(next);
    },roomCode);
    const offReady=roomBus.on('PLAYER_READY_UPDATE',event=>{
      const p=event.data,cur=snapshot.current;
      if(cur.phase!=='COURTROOM_VERDICT' || !membersRef.current.some(c=>c.id===p?.playerId)) return;
      const ready=new Set(cur.readyPlayersNextRound);p.isReady?ready.add(p.playerId):ready.delete(p.playerId);
      sync({...cur,readyPlayersNextRound:[...ready]});
    },roomCode);
    // This event already travels as a verified host command.
    const offControl=roomBus.on('JUDGE_START_DEFENSE',event=>{
      const action=event.data?.action;
      if(action==='nextCard') advanceReading();
      if(action==='startWriting') startWriting();
      if(action==='nextRound') startRound();
      const cur=snapshot.current;
      if(cur.phase==='JUDGING' && cur.party?.aiFailed && action==='retry') {
        ++generation.current;analysisKey.current='';sync({...cur,party:{...cur.party,aiReady:false,aiFailed:false}});
      }
      if(cur.phase==='JUDGING' && cur.party?.aiFailed && action==='cancel') sync(scoreJudgeParty(cur,true));
    },roomCode);
    return()=>{offState();offStart();offLobby();offSubmit();offVote();offReady();offControl();};
  },[roomCode,sync,snapshot,startRound,startWriting,closeWriting,advanceReading]);

  useEffect(()=>{
    if(state.phase==='defending' && members.length && members.every(p=>Object.hasOwn(state.excuses,p.id))) closeWriting();
    if(state.phase==='VOTING' && state.party) {
      const voters=state.party.eligibleVoterIds.filter(id=>members.some(p=>p.id===id));
      if(voters.every(id=>Boolean(state.party?.votes?.[id]))) sync({...snapshot.current,phase:'JUDGING'});
    }
    if(state.phase==='COURTROOM_VERDICT' && members.length && members.every(p=>state.readyPlayersNextRound.includes(p.id))) startRound();
  },[state.phase,state.excuses,state.party?.votes,state.readyPlayersNextRound,members,closeWriting,sync,snapshot,startRound]);

  useEffect(()=>{
    let grace:ReturnType<typeof setTimeout>|undefined;
    const timer=setInterval(()=>{
      const cur=snapshot.current;
      if(cur.phase==='case_briefing' && Date.now()>=(cur.briefingEndsAt || 0)) startWriting();
      if(cur.phase==='defending') {
        const seconds=Math.max(0,Math.ceil(((cur.defenseEndsAt || Date.now())-Date.now())/1000));
        if(seconds===0 && !grace) {
          roomBus.emit('JUDGE_TIME_UP',roomCode,{});
          grace=setTimeout(closeWriting,1200);
        }
      }
      if(cur.phase==='READING' && Date.now()>=(cur.party?.phaseEndsAt || Infinity)) advanceReading();
      if(cur.phase==='VOTING' && Date.now()>=(cur.party?.phaseEndsAt || Infinity)) sync({...cur,phase:'JUDGING'});
    },250);
    return()=>{clearInterval(timer);if(grace)clearTimeout(grace);};
  },[snapshot,sync,roomCode,startWriting,closeWriting,advanceReading]);

  // Analysis overlaps reading and voting. Persisted answers allow retry after a host reload.
  useEffect(()=>{
    const cur=snapshot.current;
    if(!['READING','VOTING','JUDGING'].includes(cur.phase) || !cur.party || cur.party.aiReady) return;
    const key=cur.roundNumber+':'+cur.currentPredicament.id;
    if(analysisKey.current===key) return;
    analysisKey.current=key;const activeGeneration=generation.current;
    const submissions=cur.party.participants.map(p=>({playerId:p.id,playerName:p.name,excuse:cur.excuses[p.id]?.excuse || ''}));
    void evaluateAllExcuses(cur.currentPredicament,submissions).then(verdicts=>{
      const latest=snapshot.current;
      if(activeGeneration!==generation.current || latest.roundNumber!==cur.roundNumber || latest.currentPredicament.id!==cur.currentPredicament.id || !latest.party) return;
      sync({...latest,party:{...latest.party,aiVerdicts:verdicts,aiReady:true,aiFailed:verdicts.some(v=>v.aiUnavailable)}});
    });
  },[state.phase,state.roundNumber,state.currentPredicament.id,state.party?.aiReady,snapshot,sync]);
  useEffect(()=>()=>{++generation.current;},[]);
  useEffect(()=>{
    if(state.phase!=='JUDGING' || !state.party?.aiReady) return;
    if(state.party.mode==='duel' && state.party.aiFailed) return;
    sync(scoreJudgeParty(snapshot.current));
  },[state.phase,state.party?.aiReady,state.party?.aiFailed,snapshot,sync]);

  if(mobileContestants) return null;
  if(state.phase==='LOBBY') return <UnifiedShabahLobby roomCode={roomCode} gameId="ai-judge" gameTitle="الشبح القاضي" role="host"/>;
  if(state.phase==='PODIUM') return <JudgeFinalPodium rankedContestants={getRankedJudgeContestants(state.cumulativeScores,members)} worstExcuses={{}} isTV onReturnToLobby={()=>roomBus.broadcastReturnToLobby(roomCode)}/>;
  if(['READING','VOTING','JUDGING','COURTROOM_VERDICT'].includes(state.phase)) return <JudgePartyStage state={publicJudgeState(state)} isHost onAction={action=>roomBus.emit('JUDGE_START_DEFENSE',roomCode,{action})}/>;
  return <section dir="rtl" className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center gap-6">
    <p className="text-purple-300">محكمة التصريف · الجولة {state.roundNumber}</p>
    <h1 className="text-3xl font-black">{state.currentPredicament.title}</h1><p className="text-2xl max-w-3xl text-center">{state.currentPredicament.description}</p>
    <p className="text-amber-300">الدليل: {state.currentPredicament.keyEvidence}</p>
    <p>{state.phase==='case_briefing'?'اقرأوا الورطة… الكتابة تبدأ بعد قليل':`${defenseSeconds} ثانية · وصل ${Object.keys(state.excuses).length} من ${members.length}`}</p>
    <p className="text-zinc-400">أقنعنا أو ضحّكنا. الجواب القصير الذكي يكسب.</p>
  </section>;
};
export default JudgeTVRoot;
