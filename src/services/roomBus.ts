/**
 * Authoritative Room Bus Facade Service
 * Points to the singleton RoomBus instance in src/lib/roomBus
 */

export {
  roomBus,
  cleanRoomCode,
  type RoomPlayer,
  type RoomEventType,
  type RoomEventPayload,
  type BusMessage,
  type JoinResult,
} from '../lib/roomBus';
