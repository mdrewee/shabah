import React,{useEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import {roomBus} from '../../lib/roomBus';
import {createReactionGate,GHOST_REACTIONS,REACTION_COOLDOWN_MS,REACTION_VISIBLE_MS,type GhostReactionId,type RoomReaction} from '../../lib/roomReactions';
import './roomReactions.css';

export function GhostReactionImage({reaction,className=''}:{reaction:GhostReactionId;className?:string}){
  const item=GHOST_REACTIONS.find(r=>r.id===reaction)!;
  return <span aria-hidden="true" className={`ghost-reaction-image ${className}`} style={{backgroundPosition:`${item.x}% ${item.y}%`}}/>;
}

export function RoomReactions({roomCode,playerId,inline=false}:{roomCode:string;playerId?:string;inline?:boolean}){
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState<Array<RoomReaction & {playerName:string}>>([]);
  const [remaining,setRemaining]=useState(0);
  const lastSent=useRef(-Infinity),gate=useRef(createReactionGate());
  const timers=useRef(new Set<ReturnType<typeof setTimeout>>());
  const panel=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    gate.current=createReactionGate();lastSent.current=-Infinity;setItems([]);setOpen(false);setRemaining(0);
    const off=roomBus.on('ROOM_REACTION',event=>{
      const accepted=gate.current(event.data,roomBus.getFormattedPlayers(roomCode));
      if(!accepted)return;
      setItems(previous=>[...previous.filter(p=>p.playerId!==accepted.playerId),accepted].slice(-3));
      const timer=setTimeout(()=>{setItems(previous=>previous.filter(p=>p.id!==accepted.id));timers.current.delete(timer);},REACTION_VISIBLE_MS);
      timers.current.add(timer);
    },roomCode);
    return ()=>{off();timers.current.forEach(clearTimeout);timers.current.clear();};
  },[roomCode]);

  useEffect(()=>{
    if(!remaining)return;
    const interval=setInterval(()=>setRemaining(Math.max(0,Math.ceil((lastSent.current+REACTION_COOLDOWN_MS-Date.now())/1000))),250);
    return()=>clearInterval(interval);
  },[remaining]);
  useEffect(()=>{
    if(!open)return;
    const close=(event:PointerEvent)=>{if(panel.current && !panel.current.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[open]);

  const send=(reaction:GhostReactionId)=>{
    const now=Date.now();
    if(!playerId || now-lastSent.current<REACTION_COOLDOWN_MS || !roomBus.getFormattedPlayers(roomCode).some(p=>p.id===playerId))return;
    lastSent.current=now;setRemaining(3);setOpen(false);
    const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
    roomBus.emit('ROOM_REACTION',roomCode,{id,playerId,reaction,sentAt:now} satisfies RoomReaction);
  };

  return <>
    <div className="ghost-reaction-feed" aria-live="polite" aria-atomic="false" dir="rtl">
      {items.map(item=><div key={item.id} className="ghost-reaction-bubble">
        <GhostReactionImage reaction={item.reaction}/>
        <span className="min-w-0"><b className="block truncate text-xs text-white">{item.playerName}</b><span className="text-[10px] text-zinc-300">{GHOST_REACTIONS.find(r=>r.id===item.reaction)?.label}</span></span>
      </div>)}
    </div>
    {playerId && <div ref={panel} className={`ghost-reaction-controls${inline?' ghost-reaction-inline':''}`} dir="rtl">
      {open && <div role="group" aria-label="اختر تفاعل الشبح" className="ghost-reaction-picker">
        <div className="col-span-3 flex items-center justify-between px-1 text-xs font-bold text-white"><span>وش ردة فعلك؟</span><button type="button" aria-label="إغلاق التفاعلات" onClick={()=>setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><X size={16}/></button></div>
        {GHOST_REACTIONS.map(item=><button key={item.id} type="button" aria-label={`إرسال تفاعل ${item.label}`} disabled={remaining>0} onClick={()=>send(item.id)} className="ghost-reaction-option"><GhostReactionImage reaction={item.id}/><span>{item.label}</span></button>)}
      </div>}
      <button type="button" aria-label={remaining?`انتظر ${remaining} ثوان لإرسال تفاعل`:'تفاعلات الشبح'} aria-expanded={open} disabled={remaining>0} onClick={()=>setOpen(value=>!value)} className="ghost-reaction-toggle">
        <GhostReactionImage reaction="laugh"/>{remaining>0 && <span className="absolute inset-0 grid place-items-center rounded-full bg-black/75 text-sm font-black text-white">{remaining}</span>}
      </button>
    </div>}
  </>;
}
