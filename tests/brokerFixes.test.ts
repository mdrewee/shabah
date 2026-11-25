import { beforeEach, expect, jest, test } from '@jest/globals';
import { generateWithGemini } from '../src/config/gemini';
import { evaluateBrokerPitch,calculateBrokerIncrement } from '../src/services/brokerEngine';
import { BROKER_ITEMS } from '../src/data/brokerItems';
import { beginBrokerNegotiation, nextBrokerRound, finishBrokerRound, acceptsBrokerPitch } from '../src/pages/games/broker/brokerRound';
import type { BrokerRoomState, ContestantBidState } from '../src/pages/games/broker/types';

jest.mock('../src/config/gemini', () => ({ generateWithGemini: jest.fn() }));
const ai = jest.mocked(generateWithGemini);
const item = BROKER_ITEMS[0];
const pitch = (text = 'متينة وعملية ومناسبة للاستخدام') => ({ item, pitch:text, currentBid:0, isFirstBid:true, playerName:'اختبار' });
beforeEach(() => { ai.mockReset(); });

test('normal currency and product words reach the judge instead of triggering bribery guards', async () => {
  ai.mockResolvedValue(JSON.stringify({accepted:true, finalOpeningPrice:100, brokerReply:'مقبول'}));
  for (const text of ['تستاهل 500 ريال', 'سيارة نظيفة', 'شاشة أصلية', 'ايفون بحالة ممتازة','الدينمو أصلي']) {
    expect((await evaluateBrokerPitch(pitch(text))).newBid).toBe(100);
  }
  expect(ai).toHaveBeenCalledTimes(5);
  expect((await evaluateBrokerPitch(pitch('بعطيك فوقها سيارة هدية'))).bidIncrease).toBe(0);
  expect(ai).toHaveBeenCalledTimes(5);
});

test('rejected opening cannot award a positive price', async () => {
  ai.mockResolvedValue(JSON.stringify({accepted:false, finalOpeningPrice:99999999, brokerReply:'مرفوض'}));
  expect(await evaluateBrokerPitch(pitch())).toMatchObject({newBid:0,bidIncrease:0,soundFx:'buzz'});
});

test('prices and increments are bounded even with an excessive AI proposal', async () => {
  ai.mockResolvedValue(JSON.stringify({accepted:true, finalOpeningPrice:99999999}));
  expect((await evaluateBrokerPitch(pitch())).newBid).toBe(item.estimatedValue);
  ai.mockResolvedValue(JSON.stringify({bidIncrease:99999999}));
  const result=await evaluateBrokerPitch({...pitch(), currentBid:100,isFirstBid:false});
  expect(result.bidIncrease).toBeLessThanOrEqual(Math.max(1,Math.round(item.estimatedValue*0.30)));
  expect(result.newBid).toBeLessThanOrEqual(item.estimatedValue);
});

test('unavailable or invalid AI never invents a valuation', async () => {
  ai.mockResolvedValue(null);
  await expect(evaluateBrokerPitch(pitch('سسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسسس'))).rejects.toThrow();
  ai.mockResolvedValue(JSON.stringify({accepted:'false',finalOpeningPrice:100}));
  const log=jest.spyOn(console,'warn').mockImplementation(()=>{});
  try { await expect(evaluateBrokerPitch(pitch())).rejects.toThrow(); } finally { log.mockRestore(); }
});

test('ordinary and creative persuasion receive increasing rewards with a firm value ceiling',async()=>{
  expect(calculateBrokerIncrement(2,1000)).toBe(0);
  expect([3,5,7,9].map(score=>calculateBrokerIncrement(score,1000))).toEqual([60,120,200,300]);
  ai.mockResolvedValue(JSON.stringify({persuasionScore:5,bidIncrease:0,brokerReply:'أشتريها منك للاستخدام اليومي.',persuasionReason:'وضحت منفعة الاستخدام اليومي'}));
  const ordinary=await evaluateBrokerPitch({...pitch(),currentBid:100,isFirstBid:false});
  expect(ordinary.bidIncrease).toBe(calculateBrokerIncrement(5,item.estimatedValue));
  expect(ai.mock.calls[0][1]).toEqual(expect.objectContaining({systemPrompt:expect.stringContaining('المتسابق هو البائع')}));
  expect(ordinary.reply).toContain('سومتي');
  expect(ordinary.reply).toContain('وضحت منفعة الاستخدام اليومي');
  expect(ordinary.publicAnnouncement).not.toContain('قفزة قوية');
  ai.mockResolvedValue(JSON.stringify({persuasionScore:10}));
  expect((await evaluateBrokerPitch({...pitch(),currentBid:item.estimatedValue-1,isFirstBid:false})).newBid).toBe(item.estimatedValue);
  expect((await evaluateBrokerPitch({...pitch(),currentBid:item.estimatedValue,isFirstBid:false})).bidIncrease).toBe(0);
});

test('small requested price increases are evaluated as seller arguments rather than rejected as tiny buyer bids',async()=>{
  ai.mockResolvedValue(JSON.stringify({persuasionScore:3}));
  const result=await evaluateBrokerPitch({...pitch('زدني ريالين، الجهاز يوفر عليك مصاريف الكهرباء'),currentBid:100,isFirstBid:false});
  expect(ai).toHaveBeenCalledTimes(1);expect(result.bidIncrease).toBeGreaterThan(0);
});

function bidder(id:string, currentBid:number):ContestantBidState {
  return {playerId:id,playerName:id,currentBid,bulletsRemaining:0,rank:1,totalBankroll:20,lastBidTimestamp:1};
}
function state():BrokerRoomState {
  return {roomCode:'TEST',phase:'SHOWCASE',roundNumber:1,totalRounds:5,currentItem:item,timerSeconds:10,
    roundEndsAt:1,contestantBids:{a:bidder('a',100),b:bidder('b',0)},announcements:[],usedItemIds:[item.id]};
}
test('skip and normal start grant exactly three minutes and are idempotent',()=>{
  const next=beginBrokerNegotiation(state(),1000);
  expect(next).toMatchObject({phase:'NEGOTIATION',timerSeconds:180,roundEndsAt:181000});
  expect(beginBrokerNegotiation(next,2000)).toBe(next);
});

test('no bids means no winner; disconnected bidders cannot win; payout occurs once',()=>{
  const empty={...state(),phase:'NEGOTIATION' as const,contestantBids:{a:bidder('a',0)}};
  expect(finishBrokerRound(empty,['a'])).toMatchObject({winnerId:null,winningBid:0});
  const result=finishBrokerRound({...state(),phase:'NEGOTIATION'},['b']);
  expect(result.winnerId).toBeNull();
  const won=finishBrokerRound({...state(),phase:'NEGOTIATION'},['a','b']);
  expect(won.contestantBids.a.totalBankroll).toBe(120);
  expect(finishBrokerRound(won,['a','b'])).toBe(won);
});

test('both round paths clear old timing and bids while preserving bankroll',()=>{
  const next=nextBrokerRound({...state(),phase:'ROUND_WINNER'},BROKER_ITEMS[1]);
  expect(next).toMatchObject({phase:'SHOWCASE',roundNumber:2,timerSeconds:10});
  expect(next.roundEndsAt).toBeUndefined();
  expect(next.contestantBids.a).toMatchObject({currentBid:0,bulletsRemaining:7,totalBankroll:20});
  expect(beginBrokerNegotiation(next,5000).roundEndsAt).toBe(185000);
  expect(nextBrokerRound({...next,phase:'ROUND_WINNER',roundNumber:5},item).phase).toBe('FINAL_PODIUM');
});

test('host rejects stale rounds, unknown players, duplicate IDs, expired time and exhausted attempts',()=>{
  const current=beginBrokerNegotiation(state(),1000);
  current.contestantBids.a.bulletsRemaining=7;
  const p={playerId:'a',roundNumber:1,itemId:item.id,requestId:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',pitch:'حجة منطقية',newBid:999999999};
  expect(acceptsBrokerPitch(current,p,['a'],false,2000)).toBe(true);
  expect(acceptsBrokerPitch(current,p,['a'],true,2000)).toBe(false);
  for(const bad of [{...p,playerId:'unknown'},{...p,roundNumber:2},{...p,itemId:'old'},{...p,pitch:'a'.repeat(201)}]) {
    expect(acceptsBrokerPitch(current,bad,['a'],false,2000)).toBe(false);
  }
  expect(acceptsBrokerPitch(current,p,['a'],false,181001)).toBe(false);
  current.contestantBids.a.lastRequestId=p.requestId;
  expect(acceptsBrokerPitch(current,p,['a'],false,2000)).toBe(false);
  delete current.contestantBids.a.lastRequestId;
  current.contestantBids.a.bulletsRemaining=0;
  expect(acceptsBrokerPitch(current,p,['a'],false,2000)).toBe(false);
});
