import {beforeEach,afterEach,expect,jest,test} from '@jest/globals';
import {useRoundTransition,ROUND_REVIEW_MS} from '../src/hooks/useRoundTransition';
let effect:(()=>void|(()=>void))|undefined;
jest.mock('react',()=>({useRef:(current:unknown)=>({current}),useEffect:(callback:()=>void)=>{effect=callback;}}));
beforeEach(()=>{jest.useFakeTimers();jest.setSystemTime(1000);});
afterEach(()=>{jest.useRealTimers();});
test('starts an authoritative deadline without waiting for ready players',()=>{
  const publish=jest.fn();useRoundTransition('RESULTS:1',undefined,publish,jest.fn());effect?.();
  expect(publish).toHaveBeenCalledWith({key:'RESULTS:1',endsAt:1000+ROUND_REVIEW_MS});
});
test('uses the remaining deadline after a reconnect and advances only once',()=>{
  const advance=jest.fn();useRoundTransition('RESULTS:1',{key:'RESULTS:1',endsAt:4000},jest.fn(),advance);effect?.();
  jest.advanceTimersByTime(2999);expect(advance).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);expect(advance).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(10000);expect(advance).toHaveBeenCalledTimes(1);
});
test('phase changes cancel pending advancement; objections clear the deadline',()=>{
  const advance=jest.fn(),publish=jest.fn();
  useRoundTransition('RESULTS:1',{key:'RESULTS:1',endsAt:4000},publish,advance);
  const cleanup=effect?.();if(typeof cleanup==='function')cleanup();
  jest.advanceTimersByTime(10000);expect(advance).not.toHaveBeenCalled();
  useRoundTransition(null,{key:'RESULTS:1',endsAt:4000},publish,advance);effect?.();
  expect(publish).toHaveBeenCalledWith(undefined);
});
