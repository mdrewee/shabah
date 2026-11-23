import { expect, jest, test } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { roomBus } from '../src/lib/roomBus';
import { requestBrokerPitch } from '../src/services/brokerPitchRequest';

jest.mock('../src/lib/roomBus',()=>({roomBus:{on:jest.fn(),broadcastBrokerBid:jest.fn()}}));

test('pitch protocol works without crypto.randomUUID and only resolves its signed response',async()=>{
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:webcrypto.getRandomValues.bind(webcrypto)}});
  let listener: any;
  const off=jest.fn();
  jest.mocked(roomBus.on).mockImplementation((_event, fn)=>{listener=fn;return off;});
  const promise=requestBrokerPitch('TEST','p',2,'item','هذه حجتي');
  const payload=jest.mocked(roomBus.broadcastBrokerBid).mock.calls[0][1];
  expect(payload).toMatchObject({playerId:'p',roundNumber:2,itemId:'item',pitch:'هذه حجتي'});
  expect(payload.requestId).toMatch(/^[a-f0-9-]{36}$/);
  expect(payload.newBid).toBeUndefined();
  const result={newBid:100,bidIncrease:100,persuasionScore:8,reply:'مقبول',soundFx:'cash',publicAnnouncement:''};
  listener({data:{kind:'broker',requestId:payload.requestId,result}});
  expect(await promise).toEqual(result);
  expect(off).toHaveBeenCalledTimes(1);
});
