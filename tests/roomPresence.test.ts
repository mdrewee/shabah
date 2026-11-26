import { expect, jest, test } from '@jest/globals';
import { roomBus } from '../src/lib/roomBus';
import { supabase } from '../src/lib/supabaseClient';
import type { RoomState } from '../src/types/game';

jest.mock('../src/lib/supabaseClient', () => ({
  supabase: { channel: jest.fn(), rpc: jest.fn(), getChannels: () => [] },
}));

test('switching games keeps the room code and clears readiness after server approval', async () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'a'.repeat(64) } });
  const rpc = jest.mocked(supabase.rpc);
  const mockRoom = {code:'QB23', selectedGameId:'ai-judge', players:[{id:'p1', isReady:true}]} as RoomState;
  const getRoom = jest.spyOn(roomBus,'getRoom').mockReturnValue(mockRoom);
  const write = jest.spyOn(roomBus,'writeLocal').mockImplementation(() => {});
  const changed = jest.fn();
  const off = roomBus.on('SHABAH_GAME_CHANGED', changed, 'QB23');
  try {
    rpc.mockReturnValueOnce(Promise.resolve({data:null,error:null}) as never);
    expect(await roomBus.changeLobbyGame('QB23','ai-guide')).toBe(false);
    expect(changed).not.toHaveBeenCalled();
    expect(mockRoom.players[0].isReady).toBe(true);
    rpc.mockReturnValueOnce(Promise.resolve({data:'11111111-1111-4111-8111-111111111119',error:null}) as never);
    expect(await roomBus.changeLobbyGame('QB23','ai-guide')).toBe(true);
    expect(write).toHaveBeenCalledWith(expect.objectContaining({code:'QB23', selectedGameId:'ai-guide'}));
    expect(mockRoom.players[0].isReady).toBe(false);
    expect(changed).toHaveBeenCalledTimes(1);
  } finally {
    off();getRoom.mockRestore();write.mockRestore();rpc.mockReset();roomBus.leaveRoom('QB23');
    if (previousStorage) Object.defineProperty(globalThis,'localStorage',previousStorage);
    else Reflect.deleteProperty(globalThis,'localStorage');
  }
});

test('returning to the lobby sends one verified command and only resets the targeted room', async () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'a'.repeat(64) } });
  const rpc = jest.mocked(supabase.rpc);
  let complete!: (value: {data: string; error: null}) => void;
  rpc.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }) as never);
  const local = jest.fn();
  const other = jest.fn();
  const offLocal = roomBus.on('RETURN_TO_LOBBY', local, 'QA23');
  const offOther = roomBus.on('RETURN_TO_LOBBY', other, 'QA24');
  try {
    const returning = roomBus.broadcastReturnToLobby('QA23');
    expect(await roomBus.broadcastReturnToLobby('QA23')).toBe(false);
    expect(local).not.toHaveBeenCalled();
    complete({data: '11111111-1111-4111-8111-111111111112', error: null});
    expect(await returning).toBe(true);
    expect(local).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
    expect(rpc.mock.calls.filter(([, args]) => args?.command === 'RETURN_TO_LOBBY')).toHaveLength(1);
  } finally {
    offLocal();offOther();rpc.mockClear();
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('an empty presence sync clears the roster and stays scoped to its room', async () => {
  jest.useFakeTimers();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'a'.repeat(64) } });
  const rpc = jest.mocked(supabase.rpc).mockImplementation(() => Promise.resolve({ data: '11111111-1111-4111-8111-111111111111', error: null }) as never);
  const callbacks = new Map<string, (message?: unknown) => void>();
  const player = { id: 'p_guest', name: 'Guest', isReady: true };
  let presence: Record<string, typeof player[]> = { guest: [player] };
  const channel = {
    state: 'joined',
    send: jest.fn(),
    on: (_kind: string, { event }: { event: string }, callback: (message?: unknown) => void) => {
      callbacks.set(event, callback);
      return channel;
    },
    subscribe: () => channel,
    presenceState: () => presence,
  };
  const fakeChannel = jest.mocked(supabase.channel).mockReturnValue(channel as never);
  const cachedRoom = jest.spyOn(roomBus, 'getRoom').mockReturnValue({ players: [player] } as RoomState);
  const writeLocal = jest.spyOn(roomBus, 'writeLocal').mockImplementation(() => {});
  const sync = jest.spyOn(roomBus, 'syncPresencePlayers').mockImplementation(() => {});
  const inRoom = jest.fn();
  const otherRoom = jest.fn();
  const ended = jest.fn();
  const offInRoom = roomBus.on('presence_sync', inRoom, 'AB23');
  const offOther = roomBus.on('presence_sync', otherRoom, 'CD45');
  const offEnded = roomBus.on('GAME_ENDED', ended, 'AB23');
  let currentRound = { phase: 'defending', roundNumber: 2, timerSeconds: 17 };
  const offRequest = roomBus.on('REQUEST_ROOM_STATE', () => {
    roomBus.broadcastJudgeSync('AB23', currentRound);
  }, 'AB23');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  try {
    roomBus.ensureSupabaseChannel('AB23', player);
    roomBus.registerChannel('AB23', channel);
    callbacks.get('sync')?.();
    jest.advanceTimersByTime(150);
    expect(inRoom).toHaveBeenLastCalledWith(expect.objectContaining({ data: [expect.objectContaining(player)] }));

    presence = {};
    callbacks.get('sync')?.();
    jest.advanceTimersByTime(150);
    expect(roomBus.getFormattedPlayers('AB23')).toEqual([]);
    expect(inRoom).toHaveBeenLastCalledWith(expect.objectContaining({ data: [] }));
    expect(otherRoom).not.toHaveBeenCalled();

    callbacks.get('room_event')?.({ payload: { roomCode: 'AB23', type: 'GAME_ENDED' } });
    callbacks.get('room_event')?.({ payload: { roomCode: 'AB23', type: 'presence_sync', data: [player] } });
    const sendState = (id: string) => callbacks.get('room_event')?.({
      payload: { roomCode: 'AB23', type: 'STATE_UPDATED', data: { code: 'AB23', id, version: 1 } },
    });
    sendState('CD45');
    expect(writeLocal).not.toHaveBeenCalled();
    sendState('AB23');
    expect(writeLocal).toHaveBeenCalledTimes(1);
    expect(ended).not.toHaveBeenCalled();
    expect(inRoom).toHaveBeenCalledTimes(2);

    callbacks.get('room_event')?.({ payload: { roomCode: 'CD45', type: 'REQUEST_ROOM_STATE' } });
    expect(channel.send).not.toHaveBeenCalled();
    callbacks.get('room_event')?.({ payload: { roomCode: 'AB23', type: 'REQUEST_ROOM_STATE' } });
    await Promise.resolve();
    expect(rpc).toHaveBeenLastCalledWith('issue_shabah_room_command', expect.objectContaining({code: 'AB23', command: 'JUDGE_STATE_SYNC', body: expect.objectContaining(currentRound)}));
    expect(channel.send).toHaveBeenCalledWith(expect.objectContaining({ event: 'HOST_COMMAND' }));
    expect(callbacks.has('JUDGE_STATE_SYNC')).toBe(false);

    currentRound = { ...currentRound, timerSeconds: 16 };
    callbacks.get('room_event')?.({ payload: { roomCode: 'AB23', type: 'REQUEST_ROOM_STATE' } });
    currentRound = { ...currentRound, timerSeconds: 15 };
    callbacks.get('room_event')?.({ payload: { roomCode: 'AB23', type: 'REQUEST_ROOM_STATE' } });
    expect(channel.send).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    expect(channel.send).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenLastCalledWith('issue_shabah_room_command', expect.objectContaining({ body: expect.objectContaining(currentRound) }));

    const beforeReplies = rpc.mock.calls.length;
    roomBus.emit('AI_RESPONSE', 'AB23', { requestId: 'first', text: 'one' });
    roomBus.emit('AI_RESPONSE', 'AB23', { requestId: 'second', text: 'two' });
    expect(rpc).toHaveBeenCalledTimes(beforeReplies + 2);
    await Promise.resolve();

    const stateReceived = jest.fn();
    const offState = roomBus.on('JUDGE_STATE_SYNC', stateReceived, 'AB23');
    const verified = async (id: string, sequence: number | null) => {
      rpc.mockReturnValueOnce(Promise.resolve({ data: sequence === null ? null : {
        event: 'JUDGE_STATE_SYNC', payload: { phase: 'RESULTS', _hostSequence: sequence }
      }, error: null }) as never);
      callbacks.get('HOST_COMMAND')?.({payload: {id}});
      await Promise.resolve();
    };
    await verified('22222222-2222-4222-8222-222222222222', null);
    expect(stateReceived).not.toHaveBeenCalled();
    await verified('33333333-3333-4333-8333-333333333333', 12);
    expect(stateReceived).toHaveBeenCalledTimes(1);
    await verified('44444444-4444-4444-8444-444444444444', 11);
    expect(stateReceived).toHaveBeenCalledTimes(1);
    offState();
  } finally {
    offInRoom();
    offOther();
    offEnded();
    offRequest();
    roomBus.leaveRoom('AB23');
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'localStorage');
    rpc.mockReset();
    fakeChannel.mockReset();
    cachedRoom.mockRestore();
    writeLocal.mockRestore();
    sync.mockRestore();
    jest.useRealTimers();
  }
});

test('a queued broadcast is sent when the channel subscribes within the throttle window', async () => {
  jest.useFakeTimers();
  let onStatus: (status: string) => Promise<void> = async () => {};
  const channel = {
    state: 'joining',
    send: jest.fn(),
    track: jest.fn(),
    on: () => channel,
    subscribe: (callback: typeof onStatus) => {
      onStatus = callback;
      return channel;
    },
  };
  const fakeChannel = jest.mocked(supabase.channel).mockReturnValue(channel as never);
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  try {
    const code = 'CD45';
    roomBus.ensureSupabaseChannel(code, { id: 'p_guest', name: 'Guest' });
    roomBus.safeBroadcast(code, 'ROUND_STARTED', { round: 2 });
    await roomBus.trackPlayer(code, { id: 'p_guest', name: 'Guest', isReady: true });
    expect(channel.send).not.toHaveBeenCalled();
    expect(channel.track).not.toHaveBeenCalled();

    channel.state = 'joined';
    await onStatus('SUBSCRIBED');
    expect(channel.track).toHaveBeenCalledWith(expect.objectContaining({ id: 'p_guest', isReady: true }));
    expect(channel.send).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ROUND_STARTED',
      payload: expect.objectContaining({ round: 2 }),
    }));

    roomBus.leaveRoom(code);
    const replacement = { ...channel, state: 'joined' };
    roomBus.registerChannel(code, replacement);
    await onStatus('CLOSED');
    expect(roomBus.isChannelSubscribed(code)).toBe(true);
  } finally {
    roomBus.leaveRoom('CD45');
    Reflect.deleteProperty(globalThis, 'window');
    fakeChannel.mockReset();
    jest.useRealTimers();
  }
});

test('one presence update saves readiness changes for every contestant', () => {
  const players = ['p_first', 'p_second'].map((id) => ({
    id, name: id, isReady: false, isOnline: true,
  }));
  const cachedRoom = jest.spyOn(roomBus, 'getRoom').mockImplementation(() =>
    ({ players: players.map((player) => ({ ...player })) }) as RoomState
  );
  const save = jest.spyOn(roomBus, 'saveRoom').mockImplementation(() => {});
  try {
    roomBus.syncPresencePlayers('AB23', players.map((player) => ({ ...player, isReady: true })));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].players.map((player) => player.isReady)).toEqual([true, true]);
  } finally {
    cachedRoom.mockRestore();
    save.mockRestore();
  }
});
