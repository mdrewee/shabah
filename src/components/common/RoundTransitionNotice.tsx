import React,{useEffect,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {roomBus} from '../../lib/roomBus';
import type {RoundTransition} from '../../hooks/useRoundTransition';

export function RoundTransitionNotice(){
  const {pathname}=useLocation();
  const code=pathname.match(/^\/room\/([^/]+)/)?.[1]?.toUpperCase();
  const [transition,setTransition]=useState<RoundTransition>();
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{
    setTransition(undefined);if(!code)return;
    const events=['GUIDE_STATE_SYNC','BROKER_STATE_SYNC','COACH_STATE_SYNC'];
    const off=events.map(event=>roomBus.on(event as any,packet=>{
      const state=packet.data,value=state?.roundTransition;
      if(!state)return;
      setTransition(value?.key===`${state.phase}:${state.roundNumber}` && Number.isFinite(value.endsAt)?value:undefined);
      setNow(Date.now());
    },code));
    return()=>off.forEach(fn=>fn());
  },[code]);
  useEffect(()=>{if(!transition)return;const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer);},[transition]);
  if(!transition)return null;
  const seconds=Math.max(0,Math.ceil((transition.endsAt-now)/1000));
  return <div dir="rtl" role="timer" className="pointer-events-none fixed bottom-4 left-1/2 z-[1500] -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-300/40 bg-zinc-950/95 px-5 py-3 text-sm font-bold text-emerald-200 shadow-xl">الانتقال التلقائي خلال {seconds} ثانية</div>;
}
