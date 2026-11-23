import { COACH_SLOTS_ORDER, type CoachRoomState, type CoachSquad } from './types';

export function fillMissedDraftPicks(state:CoachRoomState,condition:{id:string;title:string;rulePrompt?:string}):Record<string,CoachSquad> {
  return Object.fromEntries(Object.entries(state.squads).map(([id,squad])=>{
    if(state.currentRoundSelections[id])return [id,squad];
    const preferred=COACH_SLOTS_ORDER[state.roundNumber-1];
    const vacant=(key:typeof preferred)=>!squad.slots[key]?.playerName || squad.slots[key]?.playerName.includes('خانة فارغة');
    const slot=preferred && vacant(preferred)?preferred:COACH_SLOTS_ORDER.find(vacant);
    if(!slot)return [id,squad];
    return [id,{...squad,slots:{...squad.slots,[slot]:{playerName:'خانة فارغة (فاتك الوقت)',isCustom:true,
      conditionId:condition.id,conditionTitle:condition.title,conditionPrompt:condition.rulePrompt}}}];
  }));
}
