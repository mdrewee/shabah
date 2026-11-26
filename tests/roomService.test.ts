import { beforeEach, expect, jest, test } from '@jest/globals';
import { supabase } from '../src/lib/supabase';
import { createRoom, isRoomHost } from '../src/services/roomService';
import { webcrypto } from 'node:crypto';

jest.mock('../src/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
jest.mock('../src/lib/roomBus', () => ({ roomBus: {} }));

const rpc = jest.mocked(supabase.rpc);
const storage = new Map<string, string>();
const reply=(data:unknown,error:unknown=null,status=200)=>({abortSignal:()=>Promise.resolve({data,error,status})}) as never;

beforeEach(() => {
  rpc.mockReset();
  storage.clear();
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { setItem: storage.set.bind(storage), getItem: storage.get.bind(storage), removeItem: storage.delete.bind(storage) },
  });
});

test('retries a code collision and keeps the host credential only after success', async () => {
  rpc.mockImplementationOnce(() => {
    expect(storage.size).toBe(0);
    return reply(false);
  });
  rpc.mockReturnValueOnce(reply(true));

  const result = await createRoom('ai-judge', 'p_host');

  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(rpc).toHaveBeenLastCalledWith('create_shabah_room', {
    code: result.code,
    game: 'ai-judge',
    player: 'p_host',
    secret: expect.stringMatching(/^[0-9a-f]{64}$/),
  });
  expect(isRoomHost(result.code)).toBe(true);
});

test('failed remote creation does not leave a local host credential', async () => {
  rpc.mockReturnValueOnce(reply(null, new Error('Offline'), 0));
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(await createRoom('ai-judge', 'p_host')).toMatchObject({ ok: false });
    expect(storage.size).toBe(0);
  } finally {
    warning.mockRestore();
  }
});

test('unavailable host storage stops creation before a cloud room is allocated', async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    setItem() { throw new DOMException('Storage full', 'QuotaExceededError'); },
  } });
  expect(await createRoom('ai-judge', 'p_host')).toMatchObject({ok:false,error:expect.stringContaining('بيانات المضيف')});
  expect(rpc).not.toHaveBeenCalled();
});

test.each([[404,'PGRST202','تحديثًا'],[403,'42501','رفض الاتصال'],[503,'503','مؤقتًا'],[0,'','شبكة أخرى']])('creation failure %s explains the cause without storing credentials or retrying an uncertain write',async(status,code,message)=>{
  rpc.mockReturnValueOnce(reply(null,{code,message:'private provider detail'},status));
  const warning=jest.spyOn(console,'warn').mockImplementation(()=>{});
  try {
    const result=await createRoom('ai-judge','p_host');
    expect(result).toMatchObject({ok:false,error:expect.stringContaining(message)});
    expect(JSON.stringify(result)).not.toContain('private provider detail');
    expect(storage.size).toBe(0);expect(rpc).toHaveBeenCalledTimes(1);
  }finally{warning.mockRestore();}
});

test('room creation aborts a stalled request after twenty seconds',async()=>{
  jest.useFakeTimers();
  rpc.mockReturnValueOnce({abortSignal:(signal:AbortSignal)=>new Promise(resolve=>signal.addEventListener('abort',()=>resolve({data:null,error:{code:'ABORTED'},status:0})))} as never);
  const warning=jest.spyOn(console,'warn').mockImplementation(()=>{});
  try {
    const pending=createRoom('ai-judge','p_host');
    await jest.advanceTimersByTimeAsync(20000);
    expect(await pending).toMatchObject({ok:false,error:expect.stringContaining('انتهت مهلة')});
    expect(storage.size).toBe(0);
  }finally{warning.mockRestore();jest.useRealTimers();}
});
