import {beforeEach,afterEach,expect,jest,test} from '@jest/globals';
import {requestRoomAI} from '../src/services/geminiClient';
import {supabase} from '../src/lib/supabaseClient';
import {evaluateFlyingAnswers} from '../src/pages/games/flying/flyingEngine';

jest.mock('../src/lib/supabaseClient',()=>({supabase:{functions:{invoke:jest.fn()}}}));
const invoke=jest.mocked(supabase.functions.invoke);
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
beforeEach(()=>{
  invoke.mockReset();
  Object.defineProperty(globalThis,'window',{configurable:true,value:{setTimeout,clearTimeout,location:{pathname:'/room/ABCD'}}});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=> 'a'.repeat(64)}});
});
afterEach(()=>{jest.useRealTimers();});

test('ten simultaneous AI jobs are bounded to three active calls and all finish',async()=>{
  const gates:Array<()=>void>=[];let active=0,peak=0;
  invoke.mockImplementation(async()=>{active++;peak=Math.max(peak,active);await new Promise<void>(resolve=>gates.push(resolve));active--;return {data:{text:'ok'},error:null} as any;});
  const tasks=Array.from({length:10},()=>requestRoomAI('ABCD','test',{}));
  await tick();expect(invoke).toHaveBeenCalledTimes(3);
  while(invoke.mock.calls.length<10 || gates.length){gates.splice(0).forEach(resolve=>resolve());await tick();}
  expect(await Promise.all(tasks)).toEqual(Array(10).fill('ok'));
  expect(peak).toBe(3);
});

test('a temporary upstream error retries once; access/configuration errors do not retry',async()=>{
  jest.useFakeTimers();
  Object.defineProperty(globalThis,'window',{configurable:true,value:{setTimeout,clearTimeout}});
  invoke.mockResolvedValueOnce({data:null,error:{context:new Response(JSON.stringify({code:'AI_UNAVAILABLE',retryable:true}),{status:502})}} as any)
    .mockResolvedValueOnce({data:{text:'recovered'},error:null} as any);
  const result=requestRoomAI('ABCD','test',{});
  await jest.advanceTimersByTimeAsync(1300);
  expect(await result).toBe('recovered');expect(invoke).toHaveBeenCalledTimes(2);
  invoke.mockReset().mockResolvedValue({data:null,error:{context:new Response(JSON.stringify({code:'AI_ACCESS_DENIED',retryable:false}),{status:502})}} as any);
  await expect(requestRoomAI('ABCD','test',{})).rejects.toMatchObject({name:'AIRequestError',code:'AI_ACCESS_DENIED',retryable:false});
  expect(invoke).toHaveBeenCalledTimes(1);
});

test('expired queued AI jobs never make a late request',async()=>{
  jest.useFakeTimers();Object.defineProperty(globalThis,'window',{configurable:true,value:{setTimeout,clearTimeout}});
  invoke.mockImplementation(async(_name,options)=>new Promise(resolve=>options?.signal?.addEventListener('abort',()=>resolve({data:null,error:new Error('aborted')} as any),{once:true})));
  const settled=Promise.allSettled(Array.from({length:10},()=>requestRoomAI('ABCD','test',{})));
  await tick();expect(invoke).toHaveBeenCalledTimes(3);
  await jest.advanceTimersByTimeAsync(41000);
  expect((await settled).every(result=>result.status==='rejected')).toBe(true);
  expect(invoke).toHaveBeenCalledTimes(3);
  invoke.mockResolvedValue({data:{text:'next'},error:null} as any);
  expect(await requestRoomAI('ABCD','test',{})).toBe('next');
});

test('offline flying answers preserve all totals and cannot earn points by length',async()=>{
  invoke.mockResolvedValue({data:null,error:{context:new Response(JSON.stringify({retryable:false}),{status:403})}} as any);
  const result=await evaluateFlyingAnswers({title:'سم فاكهة',category:'test'} as any,[{contestantId:'p',contestantName:'p',answer:'إجابة طويلة من اختراعي',submittedAt:1}],{p:123});
  expect(result[0]).toMatchObject({roundMeters:0,newTotalMeters:123,isValid:false,needsReview:true});
});

test('incomplete, duplicate and truthy-string flying verdicts stay unverified',async()=>{
  const submissions=['p','q','r'].map(contestantId=>({contestantId,contestantName:contestantId,answer:'جواب '+contestantId,submittedAt:1}));
  invoke.mockResolvedValue({data:{text:JSON.stringify({results:[{contestantId:'p',isValid:'false',isDuplicated:false,roundMeters:900},{contestantId:'q',isValid:true,isDuplicated:false,roundMeters:800},{contestantId:'q',isValid:true,isDuplicated:false,roundMeters:800}]})},error:null} as any);
  const results=await evaluateFlyingAnswers({title:'test',category:'test'} as any,submissions);
  expect(results.every(result=>result.needsReview && result.roundMeters===0)).toBe(true);
});

test('verified flying answers are scored independently of answer length and exact duplicates stay zero',async()=>{
  invoke.mockResolvedValue({data:{text:JSON.stringify({results:[{contestantId:'p',isValid:true,isDuplicated:false,roundMeters:850,comment:'صحيحة'}]})},error:null} as any);
  const results=await evaluateFlyingAnswers({title:'test',category:'test'} as any,[{contestantId:'p',contestantName:'p',answer:'جح',submittedAt:1}]);
  expect(results[0]).toMatchObject({roundMeters:850,tier:'legendary'});
  invoke.mockClear();
  const duplicates=await evaluateFlyingAnswers({title:'test',category:'test'} as any,['p','q'].map(contestantId=>({contestantId,contestantName:contestantId,answer:'تفاح',submittedAt:1})));
  expect(duplicates.every(result=>result.isDuplicated && result.roundMeters===0)).toBe(true);expect(invoke).not.toHaveBeenCalled();
});
