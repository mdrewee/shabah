import {expect,jest,test} from '@jest/globals';
import {roomBus} from '../src/lib/roomBus';
import {supabase} from '../src/lib/supabaseClient';
jest.mock('../src/lib/supabaseClient',()=>({supabase:{channel:jest.fn(),getChannels:()=>[],removeChannel:jest.fn(),rpc:jest.fn()}}));

test('reconnect keeps player identity and asks for the authoritative game state again',async()=>{
  jest.useFakeTimers();
  const cache=new Map<string,string>(),storage={getItem:(key:string)=>cache.get(key)||null,setItem:(key:string,value:string)=>cache.set(key,value),removeItem:(key:string)=>cache.delete(key)};
  Object.defineProperty(globalThis,'window',{configurable:true,value:{}});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:storage});
  const callbacks:Array<(status:string)=>Promise<void>>=[];
  const channels=Array.from({length:2},()=>{const channel:any={state:'joining',presenceState:()=>({}),send:jest.fn(),track:jest.fn(async()=>{}),untrack:jest.fn(),canPush:()=>true};channel.on=()=>channel;channel.subscribe=(fn:any)=>{callbacks.push(fn);return channel;};return channel;});
  jest.mocked(supabase.channel).mockReturnValueOnce(channels[0]).mockReturnValueOnce(channels[1]);
  const player={id:'same-player',name:'مازن',isHost:false,isReady:false};
  try{
    roomBus.initRoom('RT23',player);channels[0].state='joined';await callbacks[0]('SUBSCRIBED');
    channels[0].state='closed';await callbacks[0]('CHANNEL_ERROR');
    roomBus.retryConnection('RT23');roomBus.retryConnection('RT23');
    jest.advanceTimersByTime(2000);
    expect(supabase.channel).toHaveBeenCalledTimes(2);
    channels[1].state='joined';await callbacks[1]('SUBSCRIBED');
    expect(channels[1].track).toHaveBeenCalledWith(expect.objectContaining({id:'same-player',name:'مازن'}));
    expect(channels[1].send).toHaveBeenCalledWith(expect.objectContaining({payload:expect.objectContaining({type:'REQUEST_ROOM_STATE'})}));
    roomBus.leaveRoom('RT23');roomBus.retryConnection('RT23');jest.advanceTimersByTime(5000);
    expect(supabase.channel).toHaveBeenCalledTimes(2);
  }finally{roomBus.leaveRoom('RT23');jest.useRealTimers();}
});
