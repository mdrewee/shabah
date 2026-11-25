import { expect,jest,test,beforeEach } from '@jest/globals';
import { generateWithGemini } from '../src/config/gemini';
import { resolveDraftPlayer,searchDraftPlayers,canonicalDraftName } from '../src/pages/games/coach/draftPlayers';
import { evaluateSquad,evaluateAllSquadsWithAI,rankDraftEvaluations } from '../src/pages/games/coach/coachEvaluationEngine';
import { fillMissedDraftPicks } from '../src/pages/games/coach/draftRound';
import { canClaimDraftSlot } from '../src/pages/games/coach/coachRules';
import type { CoachRoomState,CoachSquad,SquadEvaluationResult } from '../src/pages/games/coach/types';
jest.mock('../src/config/gemini',()=>({generateWithGemini:jest.fn()}));
const ai=jest.mocked(generateWithGemini);
beforeEach(()=>{ai.mockReset();});
const pick=(playerName:string,conditionId='crit_002')=>({playerName,conditionId,conditionTitle:'شرط'});

test('draft search uses real positions and deduplicates names; aliases resolve to the same identity',()=>{
  const goalkeeper=resolveDraftPlayer('نوير')!;
  expect(goalkeeper.position).toBe('GK');
  const results=searchDraftPlayers('نوير');
  expect(results.some(p=>p.name===goalkeeper.name && p.position==='GK')).toBe(true);
  expect(new Set(results.map(p=>p.name)).size).toBe(results.length);
  expect(canonicalDraftName('ميسي')).toBe(canonicalDraftName('Lionel Messi'));
  expect(resolveDraftPlayer('ميسي من اختراعي')).toBeNull();
});

test('invented players cannot get a forward position, prestige, or an unsupported-condition pass',()=>{
  const result=evaluateSquad({playerId:'p',playerName:'p',slots:{FWD:pick('ميسي من اختراعي','unsupported')}});
  expect(result.totalPercentage).toBe(0);
  expect(result.slots.FWD).toMatchObject({isValidCondition:false,isValidPosition:false,playerPower:0,needsReview:true});
});

test('a wrong condition does not erase a correct position, and power requires both to be correct',async()=>{
  const squad:CoachSquad={playerId:'p',playerName:'p',slots:{FWD:pick('ميسي','crit_001')}};
  ai.mockResolvedValue(JSON.stringify({evaluations:[{playerId:'p',slots:[{slotKey:'FWD',isRealPlayer:true,isValidCondition:false,isValidPosition:true,playerPower:99}]}]}));
  const result=await evaluateAllSquadsWithAI({p:squad});
  expect(result.evaluations[0]).toMatchObject({conditionPoints:0,positionPoints:5,powerPoints:0,totalPercentage:5});
  expect(result.evaluations[0].slots.FWD).toMatchObject({isValidCondition:false,isValidPosition:true});
});

test('partial AI preserves other slots and does not double count repeated slot rows',async()=>{
  const squad:CoachSquad={playerId:'p',playerName:'p',slots:{GK:pick('نوير','crit_004'),FWD:pick('ميسي')}};
  const local=evaluateSquad(squad);
  ai.mockResolvedValue(JSON.stringify({evaluations:[{playerId:'p',slots:[{slotKey:'GK',isRealPlayer:true,isValidCondition:false,isValidPosition:true}]}]}));
  const result=await evaluateAllSquadsWithAI({p:squad});
  expect(result.evaluations[0].slots.FWD).toEqual(local.slots.FWD);
  expect(result.evaluations[0].positionPoints).toBe(10);
  expect(result.verificationMode).toBe('mixed');
  const row={slotKey:'GK',isRealPlayer:true,isValidCondition:true,isValidPosition:true};
  ai.mockResolvedValue(JSON.stringify({evaluations:[{playerId:'p',slots:[row,row]}]}));
  expect((await evaluateAllSquadsWithAI({p:squad})).evaluations[0].totalPercentage).toBe(local.totalPercentage);
});

test('empty picks and truthy string verdicts cannot gain AI points; failed retry retains previous verified results',async()=>{
  const squad:CoachSquad={playerId:'p',playerName:'p',slots:{FWD:pick('اسم مجهول')}};
  ai.mockResolvedValue(JSON.stringify({evaluations:[{playerId:'p',slots:[{slotKey:'FWD',isRealPlayer:'false',isValidCondition:true,isValidPosition:true}]}]}));
  expect((await evaluateAllSquadsWithAI({p:squad})).evaluations[0].totalPercentage).toBe(0);
  const previous=rankDraftEvaluations([{...evaluateSquad(squad),totalPercentage:31}], 'ai');
  ai.mockResolvedValue(null);
  expect((await evaluateAllSquadsWithAI({p:squad},previous)).evaluations[0].totalPercentage).toBe(31);
});

test('timeout never inserts an extra empty position for a contestant who picked another slot',()=>{
  const chosen=pick('ميسي');
  const state={roundNumber:1,currentRoundSelections:{p:chosen},squads:{p:{playerId:'p',playerName:'p',slots:{FWD:chosen}},q:{playerId:'q',playerName:'q',slots:{}}}} as unknown as CoachRoomState;
  const filled=fillMissedDraftPicks(state,{id:'one',title:'شرط'});
  expect(filled.p.slots.GK).toBeUndefined();
  expect(filled.p.slots.FWD).toBe(chosen);
  expect(filled.q.slots.GK?.playerName).toContain('خانة فارغة');
  expect(state.squads.q.slots.GK).toBeUndefined();
});

test('draft claims need current round and cannot arrive at or after the deadline',()=>{
  const state={phase:'DRAFTING',roundNumber:2,roundEndsAt:5000,currentRoundSelections:{},squads:{p:{slots:{}}}} as unknown as CoachRoomState;
  expect(canClaimDraftSlot(state,'p','MID',2,4999)).toBe(true);
  expect(canClaimDraftSlot(state,'p','MID',undefined,4999)).toBe(false);
  expect(canClaimDraftSlot(state,'p','MID',2,5000)).toBe(false);
});

test('equal percentages share ranks and rewards; zero-score squads do not get a fake winner',()=>{
  const base=evaluateSquad({playerId:'a',playerName:'a',slots:{}});
  const verdict=rankDraftEvaluations([{...base,totalPercentage:50},{...base,playerId:'b',playerName:'b',totalPercentage:50}]);
  expect(verdict.isTie).toBe(true);
  expect(verdict.evaluations.map(p=>[p.rank,p.matchPointsAwarded])).toEqual([[1,5],[1,5]]);
  const empty=rankDraftEvaluations([base]);
  expect(empty.winnerId).toBe('');expect(empty.evaluations[0].matchPointsAwarded).toBe(0);
});

test('verified known players use AI strength and exact power breaks a rounded score tie',async()=>{
  const squads={a:{playerId:'a',playerName:'a',slots:{FWD:pick('ميسي')}},b:{playerId:'b',playerName:'b',slots:{FWD:pick('محمد صلاح')}}};
  ai.mockResolvedValue(JSON.stringify({evaluations:Object.keys(squads).map((playerId,index)=>({playerId,slots:[{slotKey:'FWD',isRealPlayer:true,isValidCondition:true,isValidPosition:true,playerPower:99-index}]}))}));
  const verdict=await evaluateAllSquadsWithAI(squads);
  expect(verdict.evaluations[0].slots.FWD.playerPower).toBe(99);
  expect(verdict.evaluations[1].slots.FWD.playerPower).toBe(98);
  expect(verdict.evaluations[0].totalPercentage).toBe(verdict.evaluations[1].totalPercentage);
  expect(verdict.isTie).toBe(false);expect(verdict.winnerId).toBe('a');
  expect(verdict.evaluations.map(e=>e.rank)).toEqual([1,2]);
});

test('fully valid formations are decided by football strength across all five positions',async()=>{
  const slots={GK:pick('نوير'),DEF_1:pick('راموس'),DEF_2:pick('مالديني'),MID:pick('مودريتش'),FWD:pick('ميسي')};
  const squads={a:{playerId:'a',playerName:'a',slots},b:{playerId:'b',playerName:'b',slots:{...slots,FWD:pick('محمد صلاح')}}};
  ai.mockResolvedValue(JSON.stringify({evaluations:Object.keys(squads).map((playerId,index)=>({playerId,slots:Object.keys(slots).map(slotKey=>({slotKey,isRealPlayer:true,isValidCondition:true,isValidPosition:true,playerPower:index?85:95}))}))}));
  const verdict=await evaluateAllSquadsWithAI(squads);
  expect(ai).toHaveBeenLastCalledWith(expect.any(String),expect.objectContaining({temperature:0.1}));
  expect(verdict.verificationMode).toBe('ai');
  for(const evaluation of verdict.evaluations){expect(evaluation.conditionPoints).toBe(40);expect(evaluation.positionPoints).toBe(25);}
  expect(verdict.winnerId).toBe('a');expect(verdict.isTie).toBe(false);
  expect(verdict.evaluations[0].powerPoints).toBeGreaterThan(verdict.evaluations[1].powerPoints);
});

test('compact judgments cover fifty slots and reject invented identities without weakening validation',async()=>{
  const slots={GK:pick('نوير'),DEF_1:pick('راموس'),DEF_2:pick('مالديني'),MID:pick('مودريتش'),FWD:pick('ميسي')};
  const squads=Object.fromEntries(Array.from({length:10},(_,i)=>['p'+i,{playerId:'p'+i,playerName:'p'+i,slots}]));
  ai.mockResolvedValue(JSON.stringify({evaluations:Object.keys(squads).map(playerId=>({playerId,slots:Object.keys(slots).map(slotKey=>({slotKey,r:playerId!=='p9',c:true,p:true,w:95,cWhy:'مطابق',pWhy:'مركز صحيح'}))}))}));
  const verdict=await evaluateAllSquadsWithAI(squads);
  expect(verdict.verificationMode).toBe('ai');
  expect(verdict.evaluations.flatMap(e=>Object.values(e.slots)).filter(s=>!s.needsReview)).toHaveLength(50);
  expect(verdict.evaluations.find(e=>e.playerId==='p9')?.totalPercentage).toBe(0);
  ai.mockResolvedValue(JSON.stringify({evaluations:[{playerId:'p0',slots:[{slotKey:'GK',r:'true',c:true,p:true,w:99}]}]}));
  expect((await evaluateAllSquadsWithAI(squads)).evaluations.find(e=>e.playerId==='p0')?.slots.GK.needsReview).toBe(true);
});
