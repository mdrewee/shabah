export const GHOST_REACTIONS=[
  {id:'laugh',label:'ضحك',x:0,y:0},
  {id:'shock',label:'صدمة',x:50,y:0},
  {id:'celebrate',label:'حماس',x:100,y:0},
  {id:'angry',label:'معصّب',x:0,y:100},
  {id:'think',label:'يفكر',x:50,y:100},
  {id:'sleepy',label:'طفشان',x:100,y:100},
] as const;
export type GhostReactionId=typeof GHOST_REACTIONS[number]['id'];
export interface RoomReaction {id:string;playerId:string;reaction:GhostReactionId;sentAt:number}
export const REACTION_COOLDOWN_MS=3000;
export const REACTION_VISIBLE_MS=2000;

// Each receiver independently rejects stale, duplicate, non-member and spam events.
export function createReactionGate(){
  const seen=new Map<string,number>(),lastByPlayer=new Map<string,number>();
  return (data:unknown,players:Array<{id:string;name:string}>,now=Date.now()): (RoomReaction & {playerName:string}) | null=>{
    const p=data as Partial<RoomReaction> | null;
    if(!p || typeof p.id!=='string' || !/^[a-f0-9]{32}$/.test(p.id) || typeof p.playerId!=='string' ||
      !GHOST_REACTIONS.some(r=>r.id===p.reaction) || typeof p.sentAt!=='number' || !Number.isFinite(p.sentAt) || Math.abs(now-p.sentAt)>30000)return null;
    const member=players.find(player=>player.id===p.playerId);
    if(!member || seen.has(p.id) || now-(lastByPlayer.get(p.playerId) ?? -Infinity)<REACTION_COOLDOWN_MS)return null;
    for(const [id,time] of seen)if(now-time>30000)seen.delete(id);
    for(const id of lastByPlayer.keys())if(!players.some(player=>player.id===id))lastByPlayer.delete(id);
    if(seen.size>=128)seen.delete(seen.keys().next().value!);
    seen.set(p.id,now);lastByPlayer.set(p.playerId,now);
    return {id:p.id,playerId:p.playerId,reaction:p.reaction as GhostReactionId,sentAt:p.sentAt,playerName:Array.from(member.name || 'متسابق').slice(0,24).join('')};
  };
}
