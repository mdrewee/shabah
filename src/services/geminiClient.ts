import { supabase } from '../lib/supabaseClient';

export interface CallGeminiOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

// Bound bursts from the broker without letting queued requests outlive the caller.
let activeRequests=0;
const waitingRequests:Array<()=>void>=[];
async function acquireAI(signal:AbortSignal):Promise<()=>void> {
  if(signal.aborted)throw new Error('انتهت مهلة التحليل، حاول مرة أخرى');
  if(activeRequests>=6)await new Promise<void>((resolve,reject)=>{
    const start=()=>{signal.removeEventListener('abort',abort);resolve();};
    const abort=()=>{const index=waitingRequests.indexOf(start);if(index>=0)waitingRequests.splice(index,1);reject(new Error('انتهت مهلة انتظار التحليل، حاول مرة أخرى'));};
    waitingRequests.push(start);signal.addEventListener('abort',abort,{once:true});
  });
  else activeRequests++;
  return ()=>{const next=waitingRequests.shift();if(next)next();else activeRequests--;};
}

export class AIRequestError extends Error {
  constructor(message:string,public code:string,public retryable:boolean){super(message);this.name='AIRequestError';}
}

export async function requestRoomAI(roomCode: string, prompt: string, options: CallGeminiOptions): Promise<string> {
  const secret = localStorage.getItem('shabah_host_' + roomCode);
  if (!secret) throw new Error('تحتاج اتصالًا بالمضيف لتحليل الإجابة');
  const controller = new AbortController();
  const deadline=Date.now()+40000;
  const timeout = window.setTimeout(() => controller.abort(), 40000);
  let release:(()=>void)|undefined;
  try {
    release=await acquireAI(controller.signal);
    for(let attempt=0;attempt<2;attempt++){
      if(controller.signal.aborted || Date.now()>=deadline)throw new Error('انتهت مهلة التحليل، حاول مرة أخرى');
      const { data,error }=await supabase.functions.invoke('shabah-ai',{body:{roomCode,secret,prompt,options},signal:controller.signal});
      if(!error && typeof data?.text==='string' && data.text.trim())return data.text;
      let details=data;
      const response=error?.context;
      if(response instanceof Response){try{details=await response.clone().json();}catch{}}
      const status=response instanceof Response?response.status:0;
      const retryable=typeof details?.retryable==='boolean'?details.retryable:([408,429,500,502,503,504].includes(status) || status===0);
      const code=typeof details?.code==='string'?details.code:'AI_UNAVAILABLE';
      const message=code==='AI_RATE_LIMIT'?'خدمة الشبح مزدحمة؛ انتظر قليلًا ثم أعد المحاولة':
        ['AI_NOT_CONFIGURED','AI_ACCESS_DENIED','AI_BILLING_REQUIRED','AI_MODEL_UNAVAILABLE'].includes(code)?'خدمة التحليل تحتاج مراجعة إعداداتها من المضيف':'تعذر التحليل الآن؛ إجابتك محفوظة، حاول مرة أخرى';
      if(attempt===1 || !retryable || controller.signal.aborted)throw new AIRequestError(message,code,Boolean(retryable));
      await new Promise<void>(resolve=>{const finish=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',finish);resolve();};const timer=setTimeout(finish,800+Math.random()*400);controller.signal.addEventListener('abort',finish,{once:true});});
    }
    throw new Error('تعذّر التحليل، حاول مرة أخرى');
  } finally {
    release?.();
    window.clearTimeout(timeout);
  }
}

export async function callGeminiWithFallback(
  prompt: string,
  optionsOrSystemInstruction: string | CallGeminiOptions = {}
): Promise<string> {
  const options = typeof optionsOrSystemInstruction === 'string'
    ? { systemInstruction: optionsOrSystemInstruction } : optionsOrSystemInstruction;
  const parts = window.location.pathname.split('/');
  const roomCode = (parts[1] === 'room' ? parts[2] : parts[3] || '').toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{4}$/.test(roomCode)) throw new Error('افتح غرفة قبل طلب التحليل');
  if (localStorage.getItem('shabah_host_' + roomCode)) return requestRoomAI(roomCode, prompt, options);

  const { roomBus } = await import('../lib/roomBus');
  const requestId = crypto.randomUUID();
  const playerId = sessionStorage.getItem('shabah_player_id') || localStorage.getItem('shabah_player_id');
  return new Promise((resolve, reject) => {
    const off = roomBus.on('AI_RESPONSE', (event) => {
      const result = event.data;
      if (result?.requestId !== requestId) return;
      off();
      window.clearTimeout(timer);
      if (typeof result.text === 'string') resolve(result.text);
      else reject(new Error('تعذّر التحليل، حاول مرة أخرى'));
    }, roomCode);
    const timer = window.setTimeout(() => {
      off();
      reject(new Error('المضيف لم يرد خلال الوقت المحدد'));
    }, 45000);
    roomBus.emit('AI_REQUEST', roomCode, { requestId, playerId, prompt, options });
  });
}
