import {expect,jest,test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function server(upstreamStatus:number|number[],key='test-key',allowed=true){
  let handler:(request:Request)=>Promise<Response>;
  const statuses=Array.isArray(upstreamStatus)?[...upstreamStatus]:[upstreamStatus],last=statuses.at(-1)!;
  const fetchMock=jest.fn(async()=>{const status=statuses.shift() ?? last;return new Response(status===200?JSON.stringify({candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]}):'private upstream message test-key',{status});});
  const reserve=jest.fn(async()=>({data:allowed ? { game: 'ai-flying', roomCount: 72, accountCount: 1 } : null,error:null})),delays:number[]=[];
  const code=ts.transpileModule(readFileSync('supabase/functions/shabah-ai/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  runInNewContext(code,{exports:{},require:()=>({createClient:()=>({rpc:reserve})}),
    Deno:{env:{get:(name:string)=>name==='GEMINI_API_KEY'?key:name==='GEMINI_MODEL'?undefined:'test'},serve:(fn:typeof handler)=>{handler=fn;}},
    Request,Response,AbortSignal,AbortController,DOMException,Error,console:{warn:jest.fn()},Math:Object.assign(Object.create(Math),{random:()=>0}),
    setTimeout:(fn:()=>void,ms:number)=>{if(ms<10000){delays.push(ms);queueMicrotask(fn);return 0;}return setTimeout(fn,ms);},clearTimeout,fetch:fetchMock});
  return {request:()=>handler(new Request('http://test',{method:'POST',body:JSON.stringify({roomCode:'ABCD',secret:'a'.repeat(64),prompt:'test'})})),fetchMock,reserve,delays};
}

test.each([[429,'AI_RATE_LIMIT',false],[503,'AI_UNAVAILABLE',false],[403,'AI_ACCESS_DENIED',false],[402,'AI_BILLING_REQUIRED',false],[404,'AI_MODEL_UNAVAILABLE',false],[400,'AI_REQUEST_INVALID',false]])('AI upstream %s returns actionable sanitized diagnostics',async(status,code,retryable)=>{
  const response=await server(status as number).request();const body=await response.json();
  expect(body).toMatchObject({code,retryable,upstreamStatus:status});
  expect(JSON.stringify(body)).not.toContain('test-key');expect(JSON.stringify(body)).not.toContain('private upstream');
});
test('missing AI configuration never contacts the provider; successful text is returned',async()=>{
  const unavailable=server(200,'');expect(await (await unavailable.request()).json()).toMatchObject({code:'AI_NOT_CONFIGURED',retryable:false});expect(unavailable.fetchMock).not.toHaveBeenCalled();
  const available=server(200);expect(await (await available.request()).json()).toEqual({text:'{"ok":true}'});
});

test('temporary overload recovers with increasing waits within one room reservation',async()=>{
  const service=server([429,503,200]);
  expect(await (await service.request()).json()).toEqual({text:'{"ok":true}'});
  expect(service.fetchMock).toHaveBeenCalledTimes(3);expect(service.reserve).toHaveBeenCalledTimes(1);
  expect(service.delays).toEqual([700,1400]);
});

test('persistent overload stops after three attempts and quota retries, while billing and invalid requests stop',async()=>{
  const overloaded=server(503);expect((await overloaded.request()).status).toBe(502);expect(overloaded.fetchMock).toHaveBeenCalledTimes(3);
  for(const status of [400,402,403]){const service=server(status);await service.request();expect(service.fetchMock).toHaveBeenCalledTimes(1);expect(service.delays).toEqual([]);}
});

test('room authorization is checked before any provider request',async()=>{
  const denied=server(200,'test-key',false);expect((await denied.request()).status).toBe(403);expect(denied.fetchMock).not.toHaveBeenCalled();
});
