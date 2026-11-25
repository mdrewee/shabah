import React,{useEffect,useRef,useState} from 'react';
import {CHASE_MAZE,CHASE_START,CHASE_SPAWNS,chaseMove,chaseDistances,chaseNext,chasePellets,collectChasePellet,type ChaseDirection} from './chaseEngine';

export function WaitingChase(){
  const canvas=useRef<HTMLCanvasElement>(null),direction=useRef<ChaseDirection|null>(null),touch=useRef<{x:number;y:number}|null>(null);
  const [playing,setPlaying]=useState(false),[caught,setCaught]=useState(false),[score,setScore]=useState(0),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const element=canvas.current,ctx=element?.getContext('2d');if(!ctx)return;
    let player={...CHASE_START},enemies=CHASE_SPAWNS.map(p=>({...p})),ticks=0,points=0,pellets=chasePellets(),heading:ChaseDirection|null=null;
    direction.current=null;
    const draw=()=>{
      ctx.fillStyle='#060912';ctx.fillRect(0,0,304,240);
      CHASE_MAZE.forEach((row,y)=>Array.from(row).forEach((cell,x)=>{
        if(cell==='#'){ctx.fillStyle='#2035a2';ctx.fillRect(x*16+1,y*16+1,14,14);ctx.fillStyle='#3e58d4';ctx.fillRect(x*16+2,y*16+2,12,2);}
        else if(pellets.has(x+','+y)){ctx.fillStyle='#ffe2a0';ctx.fillRect(x*16+7,y*16+7,3,3);}
      }));
      const x=player.x*16,y=player.y*16;
      const sprite=['     pppppp     ','   ppwwwwwwpp   ','  pwwwwwwwwwwp  ',' pwwwwwwwwwwwwp ',' pwwwbbwwbbwwwp ','pwwwwbbwwbbwwwwp','pwwwwbbwwbbwwwwp','pwwwwwwwwwwwwwwp','pwwwwwwwwwwwwwwp','pwwwwwwwwwwwwwwp','pwwwwwwwwwwwwwwp','pwwwwwwwwwwwwwwp','pwwwwwwwwwwwwwwp',' pwwwpwwwwpwwwp ','  ppp pppp ppp  '];
      sprite.forEach((row,sy)=>Array.from(row).forEach((pixel,sx)=>{if(pixel===' ')return;ctx.fillStyle=pixel==='w'?'#f6faff':pixel==='b'?'#10121e':sx<8?'#a77aff':'#69efb6';ctx.fillRect(x+sx,y+sy,1,1);}));
      enemies.forEach((p,i)=>{const cx=p.x*16+8,cy=p.y*16+8,mouth=ticks%6<3?.23:.06;ctx.fillStyle=['#ffe04c','#ffc43c','#fff075','#ffdb28','#ffb92b'][i];ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,7,mouth*Math.PI,(2-mouth)*Math.PI);ctx.closePath();ctx.fill();ctx.fillStyle='#17120b';ctx.fillRect(cx,cy-4,2,2);});
    };
    draw();if(!playing)return;
    const stop=()=>{direction.current=null;heading=null;touch.current=null;};window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
    const timer=setInterval(()=>{
      if(document.hidden)return;
      ticks++;
      if(ticks%2===0){
        if(direction.current && chaseMove(player,direction.current)!==player)heading=direction.current;
        if(heading)player=chaseMove(player,heading);
        const collected=collectChasePellet(pellets,player);
        if(collected){points+=collected;setScore(points);if(!pellets.size)pellets=chasePellets();}
      }
      const hit=()=>enemies.some(p=>p.x===player.x&&p.y===player.y);
      let collision=hit();
      if(!collision){const distances=chaseDistances(player);enemies=enemies.map((p,i)=>ticks%(5+i%3)===0?chaseNext(p,distances):p);collision=hit();}
      draw();
      if(collision){clearInterval(timer);direction.current=null;setCaught(true);setPlaying(false);}
    },50);
    return()=>{clearInterval(timer);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);direction.current=null;};
  },[playing,attempt]);
  const keys:Record<string,ChaseDirection>={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  const start=()=>{setCaught(false);setScore(0);setAttempt(n=>n+1);setPlaying(true);canvas.current?.focus();};
  return <div dir="rtl" className="mx-auto mt-4 w-full max-w-[336px] rounded-2xl border border-indigo-400/30 bg-[#0c1020] p-3 shadow-lg"
    onKeyDown={event=>{const next=keys[event.key];if(next&&playing){event.preventDefault();direction.current=next;}}}>
    <div className="mb-2 flex items-center justify-between text-xs"><span className="font-black text-purple-200">اجمع النقاط واهرب!</span><span className="font-mono text-emerald-200">{score} نقطة</span></div>
    <div className="relative"><canvas ref={canvas} width={304} height={240} tabIndex={0} aria-label="اسحب بإصبعك لتوجيه الشبح وجمع النقاط والهروب من خمس شخصيات باكمان" className="block aspect-[19/15] w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" style={{imageRendering:'pixelated',touchAction:'none'}}
      onPointerDown={event=>{touch.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.focus();}}
      onPointerMove={event=>{if(!touch.current||!playing)return;const dx=event.clientX-touch.current.x,dy=event.clientY-touch.current.y;if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;direction.current=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';touch.current={x:event.clientX,y:event.clientY};}}
      onPointerUp={()=>{touch.current=null;}} onPointerCancel={()=>{touch.current=null;}}/>
      {!playing&&<div className="absolute inset-0 grid place-content-center gap-3 rounded-lg bg-black/70 px-3"><p className="text-sm font-black">{caught?'مسكوك! جرّب مرة ثانية':'خمس باكمانات… وأنت الشبح!'}</p><button type="button" onClick={start} className="mx-auto min-h-11 rounded-lg bg-emerald-300 px-5 text-sm font-black text-black">{caught?'ألعب مرة ثانية':'ابدأ اللعب'}</button></div>}
    </div>
    <p className="mt-2 text-[10px] text-zinc-400">اسحب لتغيير الاتجاه؛ الشبح يواصل الحركة بعد رفع إصبعك</p>
  </div>;
}
