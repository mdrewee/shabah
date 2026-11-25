import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,UserRound,Gamepad2} from 'lucide-react';
import {ShabahFooter} from './ShabahFooter';
export function ShabahPage({children}:{children:React.ReactNode}){
  return <div dir="rtl" className="flex min-h-[100dvh] flex-col bg-[#08080d] text-white">
    <header className="border-b border-white/10 bg-black/30"><nav aria-label="التنقل الرئيسي" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link to="/" className="flex items-center gap-2 text-sm font-bold"><ArrowRight size={18}/>الرئيسية</Link><Link to="/" className="text-2xl font-black">شبح<span className="text-emerald-300">.</span></Link><div className="flex gap-4"><Link to="/games" aria-label="ألعابي"><Gamepad2 size={21}/></Link><Link to="/account" aria-label="حسابي"><UserRound size={21}/></Link></div></nav></header>
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-16">{children}</main><ShabahFooter/>
  </div>;
}
