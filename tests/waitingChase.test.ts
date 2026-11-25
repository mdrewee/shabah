import {expect,test} from '@jest/globals';
import {CHASE_MAZE,CHASE_START,CHASE_SPAWNS,chaseDistances,chaseMove,chaseNext,chaseWalkable,chasePellets,collectChasePellet} from '../src/components/common/chaseEngine';
test('maze is connected and all five chasers can reach the ghost',()=>{
  const distances=chaseDistances(CHASE_START);expect(CHASE_SPAWNS).toHaveLength(5);expect(distances.size).toBe(CHASE_MAZE.join('').split('').filter(c=>c==='.').length);
  for(const spawn of CHASE_SPAWNS){let p=spawn;for(let i=0;i<100&&(p.x!==CHASE_START.x||p.y!==CHASE_START.y);i++)p=chaseNext(p,distances);expect(p).toEqual(CHASE_START);}
});
test('movement cannot cross walls',()=>{expect(chaseMove({x:1,y:1},'up')).toEqual({x:1,y:1});expect(chaseWalkable({x:-1,y:1})).toBe(false);expect(chaseMove(CHASE_START,'left')).toEqual({x:8,y:7});});

test('pellets only occupy corridors and award points once per cell',()=>{
  const pellets=chasePellets();
  expect(pellets.size).toBe(chaseDistances(CHASE_START).size-1);
  expect(collectChasePellet(pellets,CHASE_START)).toBe(0);
  const next=chaseMove(CHASE_START,'left'),before=pellets.size;
  expect(collectChasePellet(pellets,next)).toBe(10);
  expect(collectChasePellet(pellets,next)).toBe(0);
  expect(pellets.size).toBe(before-1);
  expect(collectChasePellet(pellets,{x:0,y:0})).toBe(0);
});

