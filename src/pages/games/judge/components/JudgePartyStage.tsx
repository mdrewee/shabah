import {RoundCelebration,roundLeaders} from '../../../../components/common/RoundCelebration';
import {ResultNavigator,resultCardId} from '../../../../components/common/ResultNavigator';
import React, { useEffect, useState } from 'react';
import type { JudgeRoomState } from '../types';
import { ShabahGhost } from '../../../../components/mascot/ShabahGhost';
import { toArabicNumber } from '../../../../utils/numberFormat';

export function JudgePartyStage({state,playerId,ownCardId,isHost=false,activePlayerIds,onVote,onReady,onAction}: {
  state:JudgeRoomState;playerId?:string;ownCardId?:string;isHost?:boolean;
  activePlayerIds?:string[];
  onVote?:(cardId:string)=>void;onReady?:()=>void;onAction?:(action:string)=>void;
}) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer);},[]);
  const party=state.party;
  if (!party) return <p className="p-6 text-white">جاري تجهيز المحكمة…</p>;
  const card=party.cards[party.readIndex];
  const seconds=Math.max(0,Math.ceil((party.phaseEndsAt-now)/1000));
  const voted=party.votedPlayerIds?.includes(playerId || '');
  const ready=state.readyPlayersNextRound.includes(playerId || '');
  const active=activePlayerIds?.length ? activePlayerIds : party.participants.map(p=>p.id);
  const readyCount=state.readyPlayersNextRound.filter(id=>active.includes(id)).length;
  const result=state.phase==='COURTROOM_VERDICT';
  const button='w-full rounded-2xl border border-purple-400/40 bg-purple-500 py-3 px-4 font-bold text-white disabled:opacity-40';
  return <section dir="rtl" className="h-full min-h-0 w-full bg-black text-white flex flex-col p-4 sm:p-6 overflow-y-auto">
    <header className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3 shrink-0">
      <div><p className="text-purple-300 text-xs">الشبح القاضي · محكمة التصريف</p><p className="font-bold text-sm">الجولة {toArabicNumber(state.roundNumber)} من {toArabicNumber(state.totalRounds)}</p></div>
      <div className="w-12 h-12"><ShabahGhost mood={result?'happy':'judging'} className="w-full h-full" /></div>
    </header>
    <div className="mx-auto w-full max-w-3xl py-4 space-y-4 flex-1">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <h1 className="font-black text-lg">{state.currentPredicament.title}</h1>
        <p className="text-zinc-300 text-sm mt-2">{state.currentPredicament.description}</p>
        <p className="text-amber-300 text-xs mt-2">الدليل: {state.currentPredicament.keyEvidence}</p>
      </div>
      {state.phase==='READING' && <>
        <div className="flex justify-between text-sm text-purple-300"><span>تصريف {toArabicNumber(party.readIndex+1)} من {toArabicNumber(party.cards.length)}</span><span>{toArabicNumber(seconds)} ث</span></div>
        <article aria-label="التصريف المجهول" className="min-h-48 rounded-3xl border-2 border-purple-400/50 bg-purple-950/30 p-6 flex flex-col justify-center text-center">
          <p className="text-xs text-purple-300 mb-4">مين صاحب التصريف؟ نكشفه {party.mode==='jury'?'بعد التصويت':'مع الحكم'}</p><p className="text-2xl sm:text-4xl font-black leading-relaxed break-words">«{card?.text}»</p>
        </article>
        <p className="text-center text-zinc-400 text-sm">{party.mode==='jury'?'اقرأوا واضحكوا… بعدها تختارون أفضل تصريف.':'لاعبان: الشبح يحكم على الذكاء والطرافة، دون تفضيل الجواب الطويل.'}</p>
      </>}
      {state.phase==='VOTING' && <>
        <h2 className="text-xl font-black">أي تصريف أقنعك أو ضحّكك أكثر؟</h2>
        <p className="text-zinc-400 text-sm">{toArabicNumber(seconds)} ث · تم التصويت {toArabicNumber(party.votedPlayerIds?.length || 0)} / {toArabicNumber(party.eligibleVoterIds.length)}</p>
        {voted && <p role="status" className="text-emerald-300">تم تسجيل صوتك. الأسماء والنتائج تظهر معًا.</p>}
        {!party.eligibleVoterIds.includes(playerId || '') && playerId && <p className="text-amber-300 text-sm">لا يوجد تصريف آخر يمكنك التصويت له؛ لا تحتاج لإرسال صوت.</p>}
        <div className="grid sm:grid-cols-2 gap-3">{party.cards.map((c,index)=><button key={c.id} type="button" disabled={!onVote || voted || c.id===ownCardId || !party.eligibleVoterIds.includes(playerId || '')} onClick={()=>onVote?.(c.id)} className="rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-right disabled:opacity-50 hover:border-purple-400">
          <span className="text-purple-300 text-xs">تصريف {toArabicNumber(index+1)}{c.id===ownCardId?' · تصريفك':''}</span><p className="mt-2 font-bold text-lg break-words">{c.text}</p>
        </button>)}</div>
        <p className="text-zinc-500 text-xs">كل صوت ٣ نقاط · لا تصويت للنفس · مكافأة الشبح نقطتان لأفضل تقييم.</p>
      </>}
      {state.phase==='JUDGING' && <div className="text-center py-8 space-y-4">
        {!party.aiFailed && <WaitingChase/>}
        <h2 className="font-black text-2xl">{party.aiFailed?'تعذر حكم الشبح':'الشبح يجهّز التعليق الأخير…'}</h2>
        <p className="text-zinc-400">{party.aiFailed?'لم نخترع درجات. المضيف يقدر يعيد المحاولة أو يلغي الجولة دون نقاط.':'الأصوات محفوظة، والأسماء ما انكشفت.'}</p>
        {isHost && party.aiFailed && <><button className={button} onClick={()=>onAction?.('retry')}>إعادة محاولة الحكم</button><button className="text-zinc-400 underline" onClick={()=>onAction?.('cancel')}>إلغاء الجولة دون نقاط</button></>}
      </div>}
      {result && <>
        <RoundCelebration award="نجم التصريف" names={party.cancelled?[]:roundLeaders((state.verdictList || []).map(v=>({name:v.playerName,score:v.score})))}/>
        <ResultNavigator scope="judge" players={(state.verdictList || []).map(v=>({id:v.playerId,name:v.playerName}))} currentId={playerId}/>
        <h2 className="font-black text-xl">{party.cancelled?'أُلغيت الجولة':'انكشفت التصاريف!'}</h2>
        {party.aiFailed && party.mode==='jury' && !party.cancelled && <p role="status" className="text-amber-300 text-sm">تعذر تعليق الشبح؛ النقاط من أصوات المجموعة فقط.</p>}
        {[...(state.verdictList || [])].sort((a,b)=>b.score-a.score).map(v=><article id={resultCardId('judge',v.playerId)} style={{borderColor:v.playerId===playerId?'#6ee7b7':undefined}} key={v.playerId} className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 space-y-2">
          <div className="flex justify-between gap-3"><h3 className="font-black">{v.playerName}{v.playerId===playerId?' · أنت':''}</h3><span className="text-emerald-300 font-black">+{toArabicNumber(v.score)}</span></div>
          <p className="text-lg font-bold break-words">{v.excuse || 'لم يرسل تصريفًا'}</p>
          <p className="text-xs text-purple-300">{party.mode==='jury'?`${toArabicNumber(party.tallies?.[v.playerId]?.votes || 0)} أصوات · مكافأة الشبح +${toArabicNumber(party.tallies?.[v.playerId]?.bonus || 0)}`:v.aiUnavailable?'لا يوجد حكم معتمد':`حكم الشبح: ${v.verdict}`}</p>
          <p className="text-zinc-300 text-sm">{v.roast}</p>
        </article>)}
      </>}
    </div>
    <footer className="sticky bottom-0 bg-black/95 py-3 border-t border-zinc-800 shrink-0 space-y-2 mx-auto w-full max-w-3xl">
      {state.phase==='READING' && isHost && <button className={button} onClick={()=>onAction?.('nextCard')}>{party.readIndex+1<party.cards.length?'التصريف التالي':party.mode==='jury'?'ابدأ التصويت':'اسمع حكم الشبح'}</button>}
      {result && onReady && <button className={button} onClick={onReady}>{ready?'جاهز ✓':'جاهز للجولة التالية'} · {toArabicNumber(readyCount)} / {toArabicNumber(active.length)}</button>}
      {result && isHost && <button className="w-full text-zinc-400 text-sm py-2" onClick={()=>onAction?.('nextRound')}>إنهاء عرض النتائج والمتابعة</button>}
    </footer>
  </section>;
}
import {WaitingChase} from '../../../../components/common/WaitingChase';
