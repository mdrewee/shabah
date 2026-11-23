import {expect,test} from '@jest/globals';
import {createReactionGate,GHOST_REACTIONS,REACTION_COOLDOWN_MS} from '../src/lib/roomReactions';
const members=[{id:'p',name:'اسم موثوق'},{id:'q',name:'صديق'}];
const event=(id='a',playerId='p',sentAt=1000)=>({id:id.repeat(32),playerId,reaction:'laugh',sentAt});

test('reaction names come from room membership and all six approved expressions are supported',()=>{
  const gate=createReactionGate();
  expect(gate({...event(),playerName:'اسم مزور'},members,1000)?.playerName).toBe('اسم موثوق');
  expect(GHOST_REACTIONS).toHaveLength(6);
  for(const reaction of GHOST_REACTIONS)expect(createReactionGate()({...event(),reaction:reaction.id},members,1000)?.reaction).toBe(reaction.id);
  expect(gate(event('b','stranger'),members,1000)).toBeNull();
});
test('duplicate deliveries and per-player bursts are ignored, other players can still react',()=>{
  const gate=createReactionGate();expect(gate(event(),members,1000)).not.toBeNull();
  expect(gate(event(),members,1100)).toBeNull();
  expect(gate(event('b'),members,1001)).toBeNull();
  expect(gate(event('c','q'),members,1001)).not.toBeNull();
  expect(gate(event('b'),members,1000+REACTION_COOLDOWN_MS)).not.toBeNull();
});
test('malformed, stale and unsupported packets cannot render reactions',()=>{
  const gate=createReactionGate();
  for(const value of [null,{},event('bad!'),{...event(),reaction:'<script>'},{...event(),sentAt:NaN},event('d','p',-40000),event('e','p',50000)])expect(gate(value,members,1000)).toBeNull();
});
test('removed members and duplicate old events cannot keep emitting',()=>{
  const gate=createReactionGate();expect(gate(event(),members,1000)).not.toBeNull();
  expect(gate(event('b','p',5000),[members[1]],5000)).toBeNull();
  expect(gate(event(),members,5000)).toBeNull();
});
