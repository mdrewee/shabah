import React,{useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {Link} from 'react-router-dom';
import {supabase} from '../lib/supabaseClient';
import {ShabahPage} from '../components/common/ShabahPage';
import {ShabahGhost} from '../components/mascot/ShabahGhost';
import {getPersistedPlayerName,setPersistedPlayerName} from '../utils/playerSession';

export function accountErrorMessage(problem:unknown,mode:string){
  const code=(problem as {code?:string})?.code;
  return code==='invalid_credentials'?'البريد أو كلمة المرور غير صحيحة.':code==='email_not_confirmed'?'أكد بريدك الإلكتروني قبل تسجيل الدخول.':code==='over_email_send_rate_limit'||code==='over_request_rate_limit'?'طلبات كثيرة؛ انتظر قليلًا وحاول مرة أخرى.':mode==='login'?'تعذر تسجيل الدخول. تحقق من بياناتك والاتصال.':'تعذر إتمام الطلب. تحقق من البيانات وحاول مرة أخرى.';
}

export default function ShabahAccountPage(){
  const [session,setSession]=useState<Session|null>(null),[checking,setChecking]=useState(true);
  const [mode,setMode]=useState<'login'|'signup'|'reset'|'recovery'>('login');
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(getPersistedPlayerName());
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(({data,error})=>{if(active){setSession(data.session);setChecking(false);if(error)setError('تعذر التحقق من جلسة الدخول. حاول تحديث الصفحة.');}}).catch(()=>{if(active){setChecking(false);setError('تعذر الاتصال بخدمة الحسابات.');}});
    const {data}=supabase.auth.onAuthStateChange((event,next)=>{if(!active)return;setSession(next);setChecking(false);if(event==='PASSWORD_RECOVERY')setMode('recovery');const display=next?.user.user_metadata?.display_name;if(typeof display==='string')setName(display.slice(0,24));});
    return()=>{active=false;data.subscription.unsubscribe();};
  },[]);
  const switchMode=(next:typeof mode)=>{setMode(next);setError('');setMessage('');setPassword('');};
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    try{
      if(mode==='signup'&&!name.trim())throw new Error('اكتب اسم العرض أولًا.');
      if(mode==='reset'){
        const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+'/account'});if(error)throw error;
        setMessage('إذا كان البريد مسجلًا، ستصلك رسالة لاستعادة كلمة المرور.');
      }else if(mode==='recovery'){
        const {error}=await supabase.auth.updateUser({password});if(error)throw error;setPassword('');setMode('login');setMessage('تم تحديث كلمة المرور.');
      }else if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:name.trim()},emailRedirectTo:window.location.origin+'/account'}});if(error)throw error;
        setPassword('');if(data.session){setSession(data.session);setPersistedPlayerName(name.trim());}else setMessage('راجع بريدك لتأكيد الحساب، ثم سجل الدخول.');
      }else{
        const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;
        setPassword('');setSession(data.session);const display=data.user?.user_metadata?.display_name;if(typeof display==='string'&&display.trim())setPersistedPlayerName(display.trim());
      }
    }catch(problem){setError(accountErrorMessage(problem,mode));}
    finally{setBusy(false);}
  };
  const saveName=async()=>{if(!name.trim()||busy)return;setBusy(true);setError('');setMessage('');try{const {error}=await supabase.auth.updateUser({data:{display_name:name.trim()}});if(error)throw error;setPersistedPlayerName(name.trim());setMessage('تم حفظ اسم العرض.');}catch{setError('تعذر حفظ الاسم. حاول مرة أخرى.');}finally{setBusy(false);}};
  return <ShabahPage><section className="mx-auto max-w-md"><ShabahGhost mood="happy" className="mx-auto h-28 w-28" trackPointer={false}/><h1 className="mt-5 text-center text-3xl font-black">{mode==='recovery'?'كلمة مرور جديدة':session?'حسابي في شبح':mode==='signup'?'انضم للربع':mode==='reset'?'نسيت كلمة المرور؟':'حيّاك في شبح'}</h1><p className="mt-3 text-center text-sm text-zinc-400">{session?'حسابك واسمك، في مكان واحد.':'سجل دخولك وخلك جاهز للسهرة.'}</p>
    <div className="mt-7 rounded-3xl border border-white/10 bg-white/[.035] p-6 sm:p-8">
      {error&&<p role="alert" className="mb-5 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{message&&<p role="status" className="mb-5 rounded-xl bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-200">{message}</p>}
      {checking?<p role="status" className="text-center text-zinc-300">نتحقق من حسابك…</p>:session&&mode!=='recovery'?<div className="space-y-5"><p className="break-all text-sm text-zinc-300" dir="ltr">{session.user.email}</p><label className="block text-sm">اسم العرض<input value={name} onChange={e=>setName(e.target.value)} maxLength={24} className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-4 text-white"/></label><button disabled={busy||!name.trim()} onClick={saveName} className="min-h-12 w-full rounded-xl bg-white font-bold text-black disabled:opacity-40">{busy?'لحظة…':'حفظ الاسم'}</button><Link to="/games" className="block rounded-xl border border-purple-300/30 py-3 text-center font-bold text-purple-200">تصفح ألعابي</Link><button disabled={busy} onClick={async()=>{setBusy(true);const {error}=await supabase.auth.signOut();setBusy(false);if(error)setError('تعذر تسجيل الخروج. حاول مرة أخرى.');else{setSession(null);setMessage('');}}} className="w-full py-2 text-sm text-zinc-400">تسجيل الخروج</button></div>:<form onSubmit={submit} className="space-y-5">
        {mode==='signup'&&<label className="block text-sm">اسم العرض<input required maxLength={24} value={name} onChange={e=>setName(e.target.value)} autoComplete="nickname" className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-4 text-white"/></label>}
        {mode!=='recovery'&&<label className="block text-sm">البريد الإلكتروني<input required type="email" dir="ltr" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-4 text-white"/></label>}
        {mode!=='reset'&&<label className="block text-sm">كلمة المرور<input required type="password" minLength={mode==='login'?1:8} maxLength={128} dir="ltr" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/30 px-4 text-white"/>{mode!=='login'&&<span className="mt-2 block text-xs text-zinc-500">٨ أحرف على الأقل.</span>}</label>}
        {mode==='signup'&&<label className="flex items-start gap-2 text-xs leading-6 text-zinc-400"><input required type="checkbox" className="mt-1.5"/><span>أوافق على <Link to="/terms" className="text-purple-200 underline">سياسة الاستخدام</Link> واطلعت على <Link to="/privacy" className="text-purple-200 underline">سياسة الخصوصية</Link>.</span></label>}
        <button disabled={busy} type="submit" className="min-h-12 w-full rounded-xl bg-white font-black text-black hover:bg-emerald-100 disabled:opacity-50">{busy?'لحظة…':mode==='signup'?'إنشاء حساب':mode==='reset'?'إرسال رابط الاستعادة':mode==='recovery'?'حفظ كلمة المرور':'تسجيل الدخول'}</button>
        {mode==='login'?<div className="flex justify-between gap-3 text-xs"><button type="button" onClick={()=>switchMode('signup')} className="py-2 text-purple-200">جديد؟ أنشئ حسابًا</button><button type="button" onClick={()=>switchMode('reset')} className="py-2 text-zinc-400">نسيت كلمة المرور؟</button></div>:<button type="button" onClick={()=>switchMode('login')} className="w-full py-2 text-xs text-zinc-400">العودة لتسجيل الدخول</button>}
      </form>}
    </div></section></ShabahPage>;
}
