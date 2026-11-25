import React from 'react';
import {Link} from 'react-router-dom';

export const SHABAH_SOCIALS=[{id:'instagram',label:'إنستغرام'},{id:'tiktok',label:'تيك توك'},{id:'snapchat',label:'سناب شات'},{id:'x',label:'إكس'}] as const;
function SocialIcon({id}:{id:typeof SHABAH_SOCIALS[number]['id']}){
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    {id==='instagram'?<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></>:id==='x'?<><path d="m4 3 16 18h-4L0 3" transform="translate(2 0) scale(.83 1)"/><path d="M20 3 4 21"/></>:id==='tiktok'?<><path d="M14 3v12a4 4 0 1 1-4-4v3a1 1 0 1 0 1 1V3h3c.5 3 2.5 5 6 5v3c-2.5 0-4.5-1-6-2.5"/></>:<path d="M12 3c-4 0-5 3-5 6 0 1-1 2-3 3 1 1 2 1 3 1-1 3-2 4-4 5 2 1 3 1 4 1l1 2 4-1 4 1 1-2c1 0 2 0 4-1-2-1-3-2-4-5 1 0 2 0 3-1-2-1-3-2-3-3 0-3-1-6-5-6Z"/>}
  </svg>;
}
export function ShabahFooter(){
  return <footer dir="rtl" className="relative z-20 mt-auto border-t border-white/10 bg-[#08080d] px-5 py-8 text-zinc-400">
    <div className="mx-auto flex max-w-6xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
      <div><Link to="/" className="text-2xl font-black text-white">شبح<span className="text-emerald-300">.</span></Link><p className="mt-2 text-xs">لمّة الربع تبدأ هنا.</p></div>
      <nav aria-label="روابط المنصة" className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold"><Link className="hover:text-white" to="/games">ألعابي</Link><Link className="hover:text-white" to="/privacy">سياسة الخصوصية</Link><Link className="hover:text-white" to="/terms">سياسة الاستخدام</Link><Link className="hover:text-white" to="/rights">الحقوق</Link></nav>
      <div><nav aria-label="مواقع التواصل الاجتماعي" className="flex gap-2">{SHABAH_SOCIALS.map(item=><a key={item.id} href={`https://example.com/shabah/${item.id}`} target="_blank" rel="noopener noreferrer" aria-label={`${item.label} — رابط تجريبي`} title={`${item.label} (رابط تجريبي)`} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-zinc-200 transition hover:border-purple-400 hover:text-purple-300"><SocialIcon id={item.id}/></a>)}</nav><p className="mt-2 text-[10px] text-zinc-500">روابط التواصل تجريبية حاليًا</p></div>
    </div><p className="mx-auto mt-7 max-w-6xl border-t border-white/5 pt-5 text-[11px]">© {new Date().getFullYear()} شبح. جميع حقوق محتوى المنصة الأصلي محفوظة؛ العلامات التابعة للغير لأصحابها.</p>
  </footer>;
}
