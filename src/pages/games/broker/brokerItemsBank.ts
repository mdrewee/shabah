import { BROKER_ITEMS, BrokerItem, getBrokerItemByIndex } from '../../../data/brokerItems';

export const BROKER_ITEMS_BANK: BrokerItem[] = BROKER_ITEMS;

export function getRandomBrokerItem(): BrokerItem {
  const index = Math.floor(Math.random() * BROKER_ITEMS.length);
  return BROKER_ITEMS[index];
}

export { getBrokerItemByIndex };
