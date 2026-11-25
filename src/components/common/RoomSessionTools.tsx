import React,{useEffect,useRef,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Volume2,VolumeX} from 'lucide-react';
import {roomBus} from '../../lib/roomBus';
import {sound} from '../../lib/audio';

export function RoomSessionTools(){
  const {pathname}=useLocation(),code=pathname.match(/^\/room\/([^/]+)/)?.[1]?.toUpperCase();
  const [muted,setMuted]=useState(sound.getMuted()),[status,setStatus]=useState('connecting');
  const [recovered,setRecovered]=useState(false),wasConnected=useRef(false),lostConnection=useRef(false);
  useEffect(()=>{
    if(!code)return;
    wasConnected.current=false;lostConnection.current=false;setRecovered(false);
    const tick=()=>{
      const online=navigator.onLine!==false,connected=online && roomBus.isChannelSubscribed(code);
      setMuted(sound.getMuted());setStatus(connected?'connected':online?'connecting':'offline');
      if(connected){if(lostConnection.current)setRecovered(true);wasConnected.current=true;lostConnection.current=false;}
      else if(wasConnected.current){lostConnection.current=true;setRecovered(false);}
    };
    const online=()=>{roomBus.retryConnection(code);tick();};
    tick();const timer=setInterval(tick,1000);window.addEventListener('online',online);window.addEventListener('offline',tick);
    return()=>{clearInterval(timer);window.removeEventListener('online',online);window.removeEventListener('offline',tick);};
  },[code]);
  useEffect(()=>{if(!recovered)return;const timer=setTimeout(()=>setRecovered(false),4500);return()=>clearTimeout(timer);},[recovered]);
  if(!code)return null;
  return <div dir="rtl" className="relative z-[1600] flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-zinc-950 px-3 py-1 text-xs text-white">
    <div role="status" className={status==='connected'?'text-emerald-300':'text-amber-200'}>{status==='connected'?(recovered?'رجع الاتصال · نحدّث حالة الجولة':'متصل بالغرفة'):status==='offline'?'الاتصال بالإنترنت مقطوع · لا تغلق الصفحة':'جاري الاتصال بالغرفة واستعادة الجولة…'}</div>
    <div className="flex gap-2">{status!=='connected' && <button type="button" onClick={()=>roomBus.retryConnection(code)} className="min-h-11 rounded-lg border border-amber-300/30 px-3">إعادة الاتصال</button>}
      <button type="button" aria-pressed={muted} aria-label={muted?'تفعيل الصوت':'كتم الصوت'} onClick={()=>{sound.setMuted(!muted);setMuted(!muted);}} className="grid h-11 w-11 place-items-center rounded-lg border border-white/15">{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button></div>
  </div>;
}
