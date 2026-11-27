import React,{useEffect,useState} from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { isRoomHost } from '../../../services/roomService';
import { useRoom,roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { useSafeCountdown } from '../../../hooks/useSafeCountdown';
import { getOrCreatePlayerId,getPersistedPlayerName,getOrCreatePlayerName } from '../../../utils/playerSession';
import { createInitialJudgeState,getRankedJudgeContestants } from './judgeSync';
import { JudgeMobileView } from './components/JudgeMobileView';
import { JudgePartyStage } from './components/JudgePartyStage';
import { JudgeFinalPodium } from './components/JudgeFinalPodium';
import type { JudgeRoomState } from './types';

export const JudgeMobileRoot:React.FC=()=>{
  const {code='SHBH'}=useParams<{code:string}>();const roomCode=code.trim().toUpperCase();const navigate=useNavigate();
  const [playerId]=useState(()=>getOrCreatePlayerId());
  const [playerName]=useState(()=>getPersistedPlayerName() || getOrCreatePlayerName('متهم'));
  const {connectedPlayers}=useRoomSync({roomCode,role:'contestant',playerId,playerName});
  const {room}=useRoom(roomCode);
  const [state,setState]=useState<JudgeRoomState>(()=>roomBus.getLatestGameState<JudgeRoomState>(roomCode, 'JUDGE_STATE_SYNC') ?? createInitialJudgeState(roomCode, !isRoomHost(roomCode)));
  const defenseSeconds=useSafeCountdown(state.phase==='defending' ? state.defenseEndsAt : undefined);
  const host=isRoomHost(roomCode);
  const ownKey=`judge_card_${roomCode}_${state.roundNumber}_${state.currentPredicament.id}`;
  let ownCardId='';try{ownCardId=sessionStorage.getItem(ownKey) || '';}catch{}
  useEffect(()=>{
    const off=roomBus.on('JUDGE_STATE_SYNC',event=>{if(event.data?.roomCode===roomCode)setState(event.data);},roomCode);
    roomBus.emit('REQUEST_ROOM_STATE',roomCode,{});
    return off;
  },[roomCode]);
  const submit=(excuse:string)=>{
    let cardId=ownCardId;
    if(!cardId){cardId=Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,'0')).join('');try{sessionStorage.setItem(ownKey,cardId);}catch{}}
    roomBus.broadcastJudgeExcuse(roomCode,{playerId,playerName,roundNumber:state.roundNumber,caseId:state.currentPredicament.id,cardId,excuse});
  };
  if(state.phase==='LOBBY')return <UnifiedShabahLobby roomCode={roomCode} gameId="ai-judge" gameTitle="الشبح القاضي" role="contestant" isPlayerHost={host} currentPlayerId={playerId}
    onExit={()=>{roomBus.leavePlayer(roomCode,playerId);navigate('/');}}/>;
  if(state.phase==='PODIUM')return <JudgeFinalPodium rankedContestants={getRankedJudgeContestants(state.cumulativeScores,room?.players || [{id:playerId,name:playerName}])} worstExcuses={{}}
    isTV={false} onReturnToLobby={host ? ()=>{void roomBus.broadcastReturnToLobby(roomCode);} : undefined}/>;
  if(['READING','VOTING','JUDGING','COURTROOM_VERDICT'].includes(state.phase))return <JudgePartyStage state={state} playerId={playerId} ownCardId={ownCardId} isHost={host} activePlayerIds={connectedPlayers.map(p=>p.id)}
    onVote={cardId=>roomBus.emit('JUDGE_PARTY_VOTE',roomCode,{playerId,cardId,roundNumber:state.roundNumber,caseId:state.currentPredicament.id})}
    onReady={()=>roomBus.broadcastPlayerReadyUpdate(roomCode,playerId,!state.readyPlayersNextRound.includes(playerId),playerName)}
    onAction={action=>{if(host)roomBus.emit('JUDGE_START_DEFENSE',roomCode,{action});}}/>;
  return <JudgeMobileView key={`${state.roundNumber}_${state.currentPredicament.id}`} predicament={state.currentPredicament} roundNumber={state.roundNumber} totalRounds={state.totalRounds}
    phase={state.phase} briefingEndsAt={state.briefingEndsAt} timerSeconds={state.defenseEndsAt ? defenseSeconds : state.timerSeconds}
    hasSubmitted={Boolean(state.submittedPlayerIds?.includes(playerId) || state.excuses[playerId])} onSubmitExcuse={submit}
    isCourtroomVerdict={false} isReadyForNextRound={false} onToggleReady={()=>{}} readyCount={0} totalConnectedCount={connectedPlayers.length}/>;
};
export default JudgeMobileRoot;
