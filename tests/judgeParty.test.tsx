import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach,expect,jest,test } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { openJudgeReading,publicJudgeState,acceptJudgeVote,scoreJudgeParty } from '../src/pages/games/judge/judgeParty';
import { JUDGE_CASES_POOL } from '../src/data/judgePredicaments';
import { evaluateAllExcuses } from '../src/services/judgeEngine';
import { callGeminiWithFallback } from '../src/services/geminiClient';
import { JudgePartyStage } from '../src/pages/games/judge/components/JudgePartyStage';
import type { JudgeRoomState,PlayerVerdict } from '../src/pages/games/judge/types';
jest.mock('../src/services/geminiClient',()=>({callGeminiWithFallback:jest.fn()}));
const ai=jest.mocked(callGeminiWithFallback);
const participants=[{id:'a',name:'اسم مخفي أ'},{id:'b',name:'اسم مخفي ب'},{id:'c',name:'اسم مخفي ج'}];
function initial():JudgeRoomState {
  return {roomCode:'TEST',gameVersion:2,phase:'defending',roundNumber:1,totalRounds:5,currentPredicament:JUDGE_CASES_POOL[0],usedPredicamentIds:[],timerSeconds:0,
    excuses:Object.fromEntries(participants.map((p,i)=>[p.id,{playerId:p.id,playerName:p.name,excuse:['كنت أتأكد إنه مو مسموم','الملعقة هي اللي اختارتني','الكيكة طلبت اللجوء عندي'][i],submittedAt:1}])),
    verdicts:{},revealState:'anonymous',cumulativeScores:{a:20},worstExcuses:{},readyPlayersNextRound:[]};
}
function judged(state:JudgeRoomState):PlayerVerdict[] {
  return participants.map((p,i)=>({playerId:p.id,playerName:p.name,excuse:state.excuses[p.id].excuse,verdict:'بريء',score:i===0?10:5,roast:'الكيكة تطلب محامي ثاني.'}));
}
beforeEach(()=>{Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});ai.mockReset();});

test('party bank contains 40 short unique situations with one short clue',()=>{
  expect(JUDGE_CASES_POOL).toHaveLength(40);
  expect(new Set(JUDGE_CASES_POOL.map(c=>c.id)).size).toBe(40);
  for(const c of JUDGE_CASES_POOL){expect(c.description.length).toBeLessThan(150);expect(c.keyEvidence.length).toBeLessThan(100);}
});

test('public reading/voting state hides authors, private excuses, ballot choices and early AI verdicts',()=>{
  const state=openJudgeReading(initial(),participants,1000);
  state.party!.aiVerdicts=judged(state);
  state.party!.votes={a:state.party!.cards[0].id};
  const view=publicJudgeState(state);
  expect(view.excuses).toEqual({});expect(view.verdicts).toEqual({});
  expect(view.party?.authors).toBeUndefined();expect(view.party?.votes).toBeUndefined();expect(view.party?.aiVerdicts).toBeUndefined();
  const markup=renderToStaticMarkup(<JudgePartyStage state={view} playerId="a"/>);
  expect(markup).not.toContain('اسم مخفي');expect(markup).not.toContain('الكيكة تطلب محامي');
});

test('ballot rejects self votes, unknown cards/members, duplicates, expired and previous rounds',()=>{
  const state={...openJudgeReading(initial(),participants,1000),phase:'VOTING' as const};
  const own=state.party!.cards.find(c=>state.party!.authors![c.id]==='a')!.id;
  const other=state.party!.cards.find(c=>state.party!.authors![c.id]==='b')!.id;
  const vote={playerId:'a',cardId:other,caseId:state.currentPredicament.id,roundNumber:1};
  for(const p of [{...vote,cardId:own},{...vote,cardId:'fake'},{...vote,playerId:'fake'},{...vote,roundNumber:2}])expect(acceptJudgeVote(state,p,['a','b','c'],2000)).toBe(state);
  expect(acceptJudgeVote(state,vote,['a','b','c'],10000)).toBe(state);
  const next=acceptJudgeVote(state,vote,['a','b','c'],2000);
  expect(next.party?.votes?.a).toBe(other);
  expect(acceptJudgeVote(next,vote,['a','b','c'],2000)).toBe(next);
});

test('jury votes dominate points, bonus is small, totals reveal once',()=>{
  const state=openJudgeReading(initial(),participants,1000);
  const target=state.party!.cards.find(c=>state.party!.authors![c.id]==='b')!.id;
  state.party!.votes={a:target,c:target};state.party!.aiVerdicts=judged(state);state.party!.aiReady=true;
  state.phase='JUDGING';
  const result=scoreJudgeParty(state);
  expect(result.verdicts.a.score).toBe(2);expect(result.verdicts.b.score).toBe(6);
  expect(result.cumulativeScores).toMatchObject({a:22,b:6});
  expect(result.party?.tallies?.b).toEqual({votes:2,bonus:0});
  expect(scoreJudgeParty(result)).toBe(result);
  expect(publicJudgeState(result).verdictList?.[0].playerName).toBe(participants[0].name);
});

test('two players use AI points and AI outage never invents a score based on length',async()=>{
  ai.mockRejectedValue(new Error('offline'));
  const log=jest.spyOn(console,'warn').mockImplementation(()=>{});
  let result:PlayerVerdict[]=[];
  try {result=await evaluateAllExcuses(JUDGE_CASES_POOL[0],[{playerId:'a',playerName:'a',excuse:'كلام '.repeat(20)}]);}finally{log.mockRestore();}
  expect(result[0]).toMatchObject({score:0,aiUnavailable:true});
  const state=openJudgeReading(initial(),participants.slice(0,2));state.party!.aiVerdicts=judged(state).slice(0,2);
  expect(state.party!.mode).toBe('duel');expect(scoreJudgeParty(state).verdicts.a.score).toBe(10);
  state.party!.aiFailed=true;
  expect(scoreJudgeParty(state,true).verdicts.a.score).toBe(0);
});

test('short creative reply can get full marks and original text/name always survive AI output',async()=>{
  ai.mockResolvedValue(JSON.stringify([{playerId:'a',verdict:'بريء',roast:'الملعقة شاهدة زور.'}]));
  const result=await evaluateAllExcuses(JUDGE_CASES_POOL[0],[{playerId:'a',playerName:'الاسم الأصلي',excuse:'فحص جودة'}]);
  expect(result[0]).toMatchObject({score:10,excuse:'فحص جودة',playerName:'الاسم الأصلي',aiUnavailable:false});
  expect(ai.mock.calls[0][0]).toContain('الجواب القصير الذكي');
});

test('jury retains real votes during AI outage without a fabricated bonus; no-answer cards cannot win',()=>{
  const state=openJudgeReading(initial(),participants,1000);
  const card=state.party!.cards.find(c=>state.party!.authors![c.id]==='b')!.id;
  state.party!.votes={a:card,c:card};state.party!.aiReady=true;state.party!.aiFailed=true;
  const result=scoreJudgeParty(state);
  expect(result.verdicts.b.score).toBe(6);expect(result.verdicts.a.score).toBe(0);
  expect(result.party!.tallies!.b.bonus).toBe(0);
  const empty=initial();empty.excuses={};
  expect(openJudgeReading(empty,participants).party!.cards).toEqual([]);
});
