// src/pages/ai/ai-room/services/chatContextBuilder.ts

export interface ChatTurnMessage {
  senderAvatar?: string;
  avatarName?: string;
  sender?: string;
  text: string;
}

export interface BuiltChatContext {
  formattedChatLog: string;
  targetSender: string;
  targetText: string;
}

export const buildChatContext = (
  recentMessages: ChatTurnMessage[],
  aiAvatarName: string
): BuiltChatContext => {
  // Format last 6 messages into readable script: "[الذيب]: وش قاعد تقول؟"
  const formattedChatLog = (recentMessages || [])
    .slice(-6)
    .map((m) => {
      const sender = m.senderAvatar || m.avatarName || m.sender || 'لاعب';
      return `[${sender}]: ${m.text}`;
    })
    .join('\n');

  // Identify the target message (the last human message, especially if addressing AI)
  const lastHumanMsg = [...(recentMessages || [])].reverse().find((m) => {
    const sender = m.senderAvatar || m.avatarName || m.sender;
    return sender && sender !== aiAvatarName;
  });

  const targetSender = lastHumanMsg
    ? (lastHumanMsg.senderAvatar || lastHumanMsg.avatarName || lastHumanMsg.sender || 'شخص في الغرفة')
    : 'شخص في الغرفة';
  const targetText = lastHumanMsg ? lastHumanMsg.text : '';

  return { formattedChatLog, targetSender, targetText };
};
