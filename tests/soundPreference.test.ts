import {expect,jest,test} from '@jest/globals';
test('mute survives a module reload and blocked storage never breaks gameplay',()=>{
  const cache=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>cache.get(key),setItem:(key:string,value:string)=>cache.set(key,value)}});
  jest.isolateModules(()=>{const {sound}=require('../src/lib/audio');sound.setMuted(true);expect(cache.get('shabah_sound_muted')).toBe('true');});
  jest.isolateModules(()=>{const {sound}=require('../src/lib/audio');expect(sound.getMuted()).toBe(true);sound.setMuted(false);});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}}});
  jest.isolateModules(()=>{const {sound}=require('../src/lib/audio');expect(()=>sound.setMuted(true)).not.toThrow();expect(sound.getMuted()).toBe(true);});
});
