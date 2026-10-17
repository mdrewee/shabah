// src/pages/ai/ai-room/services/banterHarvester.ts

export interface HarvestChatMessage {
  senderAvatar?: string;
  avatarName?: string;
  avatarId?: string;
  senderPlayerId?: string;
  text: string;
}

export const harvestMatchConversations = async (
  supabase: any,
  roomCode: string,
  chatLogs: HarvestChatMessage[],
  masterBluffPlayerId?: string,
  aiAvatarName?: string,
  contextQuestion?: string
) => {
  if (!supabase || !Array.isArray(chatLogs) || chatLogs.length < 4) return;

  const humanLogs = chatLogs.filter((m) => {
    const sender = m.senderAvatar || m.avatarName || '';
    return sender !== aiAvatarName;
  });

  if (humanLogs.length < 4) return;

  const pairsToInsert: Array<{
    room_code: string;
    context_question?: string;
    trigger_message: string;
    reply_message: string;
    is_master_bluff: boolean;
  }> = [];

  for (let i = 0; i < humanLogs.length - 1; i++) {
    const trigger = humanLogs[i].text?.trim() || '';
    const reply = humanLogs[i + 1].text?.trim() || '';

    // Guard: Ignore ultra-short or repetitive identical messages
    if (trigger.length >= 3 && reply.length >= 2 && trigger !== reply) {
      pairsToInsert.push({
        room_code: roomCode,
        context_question: contextQuestion || undefined,
        trigger_message: trigger.slice(0, 100),
        reply_message: reply.slice(0, 100),
        is_master_bluff: Boolean(
          masterBluffPlayerId && humanLogs[i + 1].senderPlayerId === masterBluffPlayerId
        ),
      });
    }
  }

  if (pairsToInsert.length > 0) {
    try {
      const { error } = await supabase
        .from('human_banter_vault')
        .insert(pairsToInsert.slice(0, 25));
      if (error) {
        console.warn('[Banter Harvester] Failed to insert banter pairs:', error);
      } else {
        console.log(`[Banter Harvester] Successfully stored ${pairsToInsert.length} human banter pairs!`);
      }
    } catch (err) {
      console.warn('[Banter Harvester] Error storing banter:', err);
    }
  }
};
