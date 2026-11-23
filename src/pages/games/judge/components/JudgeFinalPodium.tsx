import React from 'react';
import type { RankedJudgeContestant } from '../judgeSync';
import type { WorstExcuseRecord } from '../types';
import { ShabahGhost } from '../../../../components/mascot/ShabahGhost';
import { toArabicNumber } from '../../../../utils/numberFormat';
export function JudgeFinalPodium({rankedContestants,onReturnToLobby,isTV=false}: {
 rankedContestants:RankedJudgeContestant[];worstExcuses:Record<string,WorstExcuseRecord>;isTV?:boolean;onReturnToLobby:()=>void;
}) {
 const best=rankedContestants[0]?.score || 0;
 const winners=rankedContestants.filter(p=>p.score===best && best>0);
 return <section dir="rtl" className="min-h-full bg-black text-white p-5 flex flex-col items-center gap-5 overflow-y-auto">
  <div className="w-24 h-24"><ShabahGhost mood="happy" className="w-full h-full"/></div>
  <p className="text-purple-300 text-sm">الشبح القاضي · محكمة التصريف</p>
  <h1 className={isTV?'text-4xl font-black':'text-2xl font-black'}>{winners.length>1?'أبطال التصريف بالتعادل':winners.length?'بطل التصريف':'انتهت المحكمة بلا نقاط'}</h1>
  <p className="text-amber-300 font-bold text-xl text-center">{winners.map(p=>p.name).join(' و ')}</p>
  <p className="text-zinc-400 text-sm">{winners.length?'أذكى التصاريف وأفضل لحظات المجموعة.':'نفتحها بتصاريف أقوى في اللعبة الجاية؟'}</p>
  <div className="w-full max-w-2xl space-y-3">{rankedContestants.map((p,index)=><article key={p.id} className="flex justify-between items-center rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
   <span className="font-bold">{toArabicNumber(rankedContestants.findIndex(c=>c.score===p.score)+1)} · {p.name}</span><span className="text-emerald-300 font-black">{toArabicNumber(p.score)} نقطة</span>
  </article>)}</div>
  <button className="w-full max-w-md bg-purple-500 rounded-2xl p-4 font-bold mt-4" onClick={onReturnToLobby}>العودة للوبي</button>
 </section>;
}
