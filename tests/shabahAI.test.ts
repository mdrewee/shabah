import {expect,jest,test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function server(upstreamStatus:number,key='test-key'){
  let handler:(request:Request)=>Promise<Response>;
  const fetchMock=jest.fn(async()=>new Response(upstreamStatus===200?JSON.stringify({candidates:[{content:{parts:[{text:'{"ok":true}'}]}}]}):'private upstream message test-key',{status:upstreamStatus}));
  const code=ts.transpileModule(readFileSync('supabase/functions/shabah-ai/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  runInNewContext(code,{exports:{},require:()=>({createClient:()=>({rpc:async()=>({data:true,error:null})})}),
    Deno:{env:{get:(name:string)=>name==='GEMINI_API_KEY'?key:name==='GEMINI_MODEL'?undefined:'test'},serve:(fn:typeof handler)=>{handler=fn;}},
    Request,Response,AbortController,DOMException,console:{warn:jest.fn()},setTimeout,clearTimeout,fetch:fetchMock});
  return {request:()=>handler(new Request('http://test',{method:'POST',body:JSON.stringify({roomCode:'ABCD',secret:'a'.repeat(64),prompt:'test'})})),fetchMock};
}

test.each([[429,'AI_RATE_LIMIT',true],[503,'AI_UNAVAILABLE',true],[403,'AI_ACCESS_DENIED',false],[402,'AI_BILLING_REQUIRED',false],[404,'AI_MODEL_UNAVAILABLE',false],[400,'AI_REQUEST_INVALID',false]])('AI upstream %s returns actionable sanitized diagnostics',async(status,code,retryable)=>{
  const response=await server(status as number).request();const body=await response.json();
  expect(body).toMatchObject({code,retryable,upstreamStatus:status});
  expect(JSON.stringify(body)).not.toContain('test-key');expect(JSON.stringify(body)).not.toContain('private upstream');
});
test('missing AI configuration never contacts the provider; successful text is returned',async()=>{
  const unavailable=server(200,'');expect(await (await unavailable.request()).json()).toMatchObject({code:'AI_NOT_CONFIGURED',retryable:false});expect(unavailable.fetchMock).not.toHaveBeenCalled();
  const available=server(200);expect(await (await available.request()).json()).toEqual({text:'{"ok":true}'});
});
