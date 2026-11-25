import {afterEach,beforeEach,expect,jest,test} from '@jest/globals';
import {WaitingChase} from '../src/components/common/WaitingChase';
let mockRefIndex=0,mockStateIndex=0;
let mockEffect:(()=>void|(()=>void))|undefined;
const mockScore=jest.fn();
const mockContext={fillStyle:'',fillRect:jest.fn(),beginPath:jest.fn(),moveTo:jest.fn(),arc:jest.fn(),closePath:jest.fn(),fill:jest.fn()};
const mockCanvas={getContext:()=>mockContext,focus:jest.fn(),setPointerCapture:jest.fn()};
jest.mock('react',()=>({...jest.requireActual<typeof import('react')>('react'),
  useRef:(value:unknown)=>({current:mockRefIndex++===0?mockCanvas:value}),
  useState:(value:unknown)=>[mockStateIndex++===0?true:value,mockScore],
  useEffect:(callback:()=>void)=>{mockEffect=callback;},
}));
let cleanup:void|(()=>void);
beforeEach(()=>{
  jest.useFakeTimers();mockRefIndex=0;mockStateIndex=0;mockScore.mockClear();
  Object.assign(globalThis,{window:{addEventListener:jest.fn(),removeEventListener:jest.fn()},document:{hidden:false,addEventListener:jest.fn(),removeEventListener:jest.fn()}});
});
afterEach(()=>{cleanup?.();jest.useRealTimers();});
test('a swipe keeps moving after release and a new swipe changes direction',()=>{
  const game=WaitingChase() as any;
  const canvas=game.props.children[1].props.children[0];
  cleanup=mockEffect?.();
  const event=(x:number,y:number)=>({clientX:x,clientY:y,pointerId:1,currentTarget:mockCanvas});
  canvas.props.onPointerDown(event(100,100));canvas.props.onPointerMove(event(80,100));canvas.props.onPointerUp();
  jest.advanceTimersByTime(400);
  expect(mockScore).toHaveBeenLastCalledWith(40);
  // x=5,y=7 has an open route downward. A second swipe changes the heading.
  canvas.props.onPointerDown(event(80,100));canvas.props.onPointerMove(event(80,120));canvas.props.onPointerUp();
  jest.advanceTimersByTime(100);
  expect(mockScore).toHaveBeenLastCalledWith(50);
});
test('unmount clears the game loop immediately',()=>{
  WaitingChase();cleanup=mockEffect?.();
  expect(jest.getTimerCount()).toBe(1);cleanup?.();cleanup=undefined;
  expect(jest.getTimerCount()).toBe(0);
});
