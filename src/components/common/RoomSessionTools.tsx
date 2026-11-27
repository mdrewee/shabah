import React,{useEffect,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {roomBus} from '../../lib/roomBus';
import {isRoomHost} from '../../services/roomService';

export function RoomSessionTools(){
  const {pathname}=useLocation(),code=(pathname.match(/^\/room\/([^/]+)/)?.[1] ??
    pathname.match(/^\/game\/[^/]+\/([a-z0-9]{4})(?:\/tv)?\/?$/i)?.[1])?.toUpperCase();
  const navigate=useNavigate();
  const isJoinScreen=/^\/room\/[^/]+(?:\/join)?\/?$/.test(pathname);
  const [error, setError] = useState<string>();
  useEffect(()=>{
    if(!code || isJoinScreen)return;
    const tick=()=>setError(navigator.onLine === false ? 'انقطع الإنترنت. تحقق من اتصالك.' : roomBus.getRoomConnectionError(code));
    const online=()=>{roomBus.retryConnection(code);tick();};
    const onVisible=()=>{if(document.visibilityState==='visible' && navigator.onLine!==false)online();};
    const off=roomBus.on('ROOM_TERMINATED',event=>{
      navigate('/',{replace:true,state:{roomNotice:event.data?.reason || 'أنهى المضيف الغرفة.'}});
    },code);
    tick();const timer=setInterval(tick,1000);window.addEventListener('online',online);window.addEventListener('offline',tick);
    document.addEventListener('visibilitychange',onVisible);
    return()=>{off();clearInterval(timer);window.removeEventListener('online',online);window.removeEventListener('offline',tick);document.removeEventListener('visibilitychange',onVisible);};
  },[code,isJoinScreen,navigate,pathname]);
  useEffect(()=>{
    if(!code || isJoinScreen || !navigator.wakeLock || !isRoomHost(code))return;
    let active=true;
    let requesting=false;
    let lock:WakeLockSentinel|undefined;
    const keepAwake=async()=>{
      if(document.visibilityState!=='visible' || requesting || (lock && !lock.released))return;
      requesting=true;
      try{
        const acquired=await navigator.wakeLock.request('screen');
        if(active)lock=acquired;
        else await acquired.release();
      }catch{}finally{requesting=false;}
    };
    void keepAwake();
    document.addEventListener('visibilitychange',keepAwake);
    return()=>{active=false;document.removeEventListener('visibilitychange',keepAwake);void lock?.release().catch(()=>{});};
  },[code,isJoinScreen]);
  if(!code || isJoinScreen || !error)return null;
  return <aside dir="rtl" role="alert" className="fixed bottom-20 start-3 z-[1600] max-w-[calc(100%-1.5rem)] rounded-xl bg-zinc-950 p-3 text-sm text-amber-200 shadow-xl">
    <span>{error}</span>
    <button type="button" onClick={()=>{setError(undefined);roomBus.retryConnection(code,true);}} className="ms-3 underline">إعادة المحاولة</button>
  </aside>;
}
