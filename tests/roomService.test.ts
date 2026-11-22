import { beforeEach, expect, jest, test } from '@jest/globals';
import { supabase } from '../src/lib/supabase';
import { createRoom, isRoomHost } from '../src/services/roomService';
import { webcrypto } from 'node:crypto';

jest.mock('../src/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
jest.mock('../src/lib/roomBus', () => ({ roomBus: {} }));

const rpc = jest.mocked(supabase.rpc);
const storage = new Map<string, string>();

beforeEach(() => {
  rpc.mockReset();
  storage.clear();
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { setItem: storage.set.bind(storage), getItem: storage.get.bind(storage) },
  });
});

test('retries a code collision and keeps the host credential only after success', async () => {
  rpc.mockImplementationOnce(() => {
    expect(storage.size).toBe(0);
    return Promise.resolve({ data: false, error: null }) as never;
  });
  rpc.mockReturnValueOnce(Promise.resolve({ data: true, error: null }) as never);

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
  rpc.mockReturnValueOnce(Promise.resolve({ data: null, error: new Error('Offline') }) as never);
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(await createRoom('ai-judge', 'p_host')).toMatchObject({ ok: false });
    expect(storage.size).toBe(0);
  } finally {
    warning.mockRestore();
  }
});
