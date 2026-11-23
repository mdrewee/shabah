import { roomBus } from '../lib/roomBus';
import type { BrokerEvaluationResult } from './brokerEngine';

export function requestBrokerPitch(roomCode: string, playerId: string, roundNumber: number, itemId: string, pitch: string): Promise<BrokerEvaluationResult> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  const requestId = `${token.slice(0,8)}-${token.slice(8,12)}-${token.slice(12,16)}-${token.slice(16,20)}-${token.slice(20)}`;
  return new Promise((resolve, reject) => {
    const off = roomBus.on('AI_RESPONSE', event => {
      const data = event.data;
      if (data?.requestId !== requestId || data.kind !== 'broker') return;
      off(); clearTimeout(timer);
      if (data.result) resolve(data.result);
      else reject(new Error('تعذر اعتماد الحجة'));
    }, roomCode);
    const timer = setTimeout(() => { off(); reject(new Error('انتهت مهلة التقييم')); }, 50000);
    roomBus.broadcastBrokerBid(roomCode, { playerId, roundNumber, itemId, pitch, requestId });
  });
}
