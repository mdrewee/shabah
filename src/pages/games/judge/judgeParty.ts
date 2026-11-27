import type { JudgeRoomState, PlayerVerdict } from './types';

export const JUDGE_DEFENSE_SECONDS = 40;
export const JUDGE_VOTE_SECONDS = 28;
export const JUDGE_READING_MS = 12_000;

export function openJudgeReading(state: JudgeRoomState, participants: Array<{ id: string; name: string }>, now = Date.now()): JudgeRoomState {
  participants = participants.filter(p => p.id !== 'host_tv');
  const cards = participants.filter(p => state.excuses[p.id]?.excuse.trim()).map(p => ({
    id: state.excuses[p.id].cardId || Array.from(crypto.getRandomValues(new Uint8Array(12)), n => n.toString(16).padStart(2,'0')).join(''),
    text: state.excuses[p.id].excuse,
    author: p.id,
  }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  const authors = Object.fromEntries(cards.map(c => [c.id,c.author]));
  return { ...state, phase:'READING', timerSeconds:0, party:{
    participants, cards:cards.map(({id,text})=>({id,text})), authors, votes:{}, votedPlayerIds:[],
    eligibleVoterIds:participants.filter(p => cards.some(c => c.author !== p.id)).map(p => p.id),
    mode:participants.length >= 3 ? 'jury' : 'duel', readIndex:0, phaseEndsAt:now + JUDGE_READING_MS,
  }};
}

export function acceptJudgeVote(state: JudgeRoomState, payload: any, activeIds: string[], now = Date.now()): JudgeRoomState {
  const party = state.party;
  if (!party || state.phase !== 'VOTING' || now >= party.phaseEndsAt || payload?.roundNumber !== state.roundNumber ||
      payload.caseId !== state.currentPredicament.id || !activeIds.includes(payload.playerId) ||
      !party.eligibleVoterIds.includes(payload.playerId) || party.votes?.[payload.playerId] ||
      !party.cards.some(c => c.id === payload.cardId) || party.authors?.[payload.cardId] === payload.playerId) return state;
  const votes={...party.votes,[payload.playerId]:payload.cardId};
  return {...state,party:{...party,votes,votedPlayerIds:Object.keys(votes)}};
}

// Broadcast the ballot without the author map, private defenses, AI scores or individual choices.
export function publicJudgeState(state: JudgeRoomState): JudgeRoomState {
  const revealed = state.phase === 'COURTROOM_VERDICT' || state.phase === 'PODIUM';
  return { ...state, submittedPlayerIds:Object.keys(state.excuses),
    excuses:revealed ? state.excuses : {}, verdicts:revealed ? state.verdicts : {}, verdictList:revealed ? state.verdictList : [],
    party:state.party ? {...state.party,authors:revealed ? state.party.authors : undefined,votes:undefined,aiVerdicts:undefined} : undefined,
  };
}

export function scoreJudgeParty(state: JudgeRoomState, cancelled = false): JudgeRoomState {
  const party=state.party;
  if (!party || state.phase === 'COURTROOM_VERDICT') return state;
  const ai=party.aiVerdicts || [];
  const best=Math.max(0,...ai.filter(v=>!v.aiUnavailable && state.excuses[v.playerId]?.excuse.trim()).map(v=>v.score));
  const hasVotes=Object.keys(party.votes ?? {}).length > 0;
  const tallies: Record<string,{votes:number;bonus:number}>={};
  const verdicts: Record<string,PlayerVerdict>={};
  const cumulativeScores={...state.cumulativeScores};
  for (const p of party.participants.filter(p => p.id !== 'host_tv')) {
    const excuse=state.excuses[p.id]?.excuse || '';
    const judged=ai.find(v=>v.playerId===p.id);
    const votes=Object.values(party.votes || {}).filter(cardId=>party.authors?.[cardId]===p.id).length;
    const bonus=!cancelled && excuse && judged && !judged.aiUnavailable && (!hasVotes || best>=5) && judged.score===best ? 2 : 0;
    const score=cancelled || !excuse ? 0 : party.mode==='jury' ? votes*3+bonus : judged?.score || 0;
    tallies[p.id]={votes,bonus:Number(bonus)};
    verdicts[p.id]={playerId:p.id,playerName:p.name,excuse,verdict:judged?.verdict || 'مذنب',score,
      roast:cancelled ? 'أُلغيت الجولة دون نقاط.' : !excuse ? 'ما وصلنا تصريفك هالجولة.' : judged?.roast || 'حكم المجموعة هو المعتمد.',
      aiUnavailable:judged?.aiUnavailable ?? !judged,
    };
    cumulativeScores[p.id]=(cumulativeScores[p.id] || 0)+score;
  }
  return {...state,phase:'COURTROOM_VERDICT',revealState:'revealed',verdicts,verdictList:Object.values(verdicts),
    cumulativeScores,readyPlayersNextRound:[],party:{...party,cancelled,tallies}};
}
