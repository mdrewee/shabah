// src/pages/ai/ai-room/components/AnonymousChatBox.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage, Suspect } from '../types';
import { AvatarBadge } from './AvatarBadge';

interface AnonymousChatBoxProps {
  messages: ChatMessage[];
  suspects: Suspect[];
  mySuspect?: Suspect;
  onSendMessage?: (text: string) => void;
  mode?: 'tv' | 'mobile';
  disabled?: boolean;
}

export const AnonymousChatBox: React.FC<AnonymousChatBoxProps> = ({
  messages,
  suspects,
  mySuspect,
  onSendMessage,
  mode = 'mobile',
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const lastSendTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || disabled || !onSendMessage) return;

    // Rate-limit: 1 message per second maximum
    const now = Date.now();
    if (now - lastSendTimeRef.current < 1000) return;
    lastSendTimeRef.current = now;

    onSendMessage(cleanText);
    setInputText('');
  };

  const isTv = mode === 'tv';

  return (
    <div
      className={
        isTv
          ? 'h-[600px] max-h-[65vh] flex flex-col justify-between bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl overflow-hidden'
          : 'flex flex-col h-full bg-[#E5E0D5] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] p-4 overflow-hidden'
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-[#2C2A29] shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-[#2C2A29]" size={isTv ? 24 : 20} />
          <h2 className={`${isTv ? 'text-xl' : 'text-lg'} font-black text-[#000000]`}>
            غرفة التحقيق والشات الحي
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span className="text-xs font-bold text-stone-600">مباشر</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-500 font-bold space-y-2">
            <MessageSquare size={36} className="opacity-40" />
            <p className="text-xs">لا توجد رسائل بعد... ابدأوا التحقيق وتبادل الشكوك!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const suspect = suspects.find((s) => s.avatarId === msg.avatarId);
            const isMe = mySuspect && mySuspect.avatarId === msg.avatarId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  isMe ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender info */}
                <div className="flex items-center gap-2">
                  {suspect && (
                    <AvatarBadge
                      suspect={suspect}
                      size="sm"
                      isSelf={isMe}
                    />
                  )}
                  <span className="text-[10px] font-semibold text-stone-500">
                    {new Date(msg.timestamp).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 border-2 border-[#2C2A29] font-bold shadow-[2px_2px_0px_#2C2A29] ${
                    isMe
                      ? 'bg-[#8A9A5B] text-white rounded-br-none'
                      : 'bg-white text-[#000000] rounded-bl-none'
                  } ${isTv ? 'text-base' : 'text-sm'}`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Bar (Only on mobile) */}
      {!isTv && (
        <form onSubmit={handleSubmit} className="pt-2 border-t-2 border-[#2C2A29] flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={disabled}
            placeholder={
              disabled
                ? 'الشات مقفل حالياً...'
                : 'اكتب رسالتك للمجموعة...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-[#2C2A29] bg-white font-bold text-[#000000] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B] shadow-[2px_2px_0px_#2C2A29] disabled:bg-stone-200"
          />
          <button
            type="submit"
            disabled={disabled || !inputText.trim()}
            className="px-5 py-2.5 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <span>إرسال</span>
            <Send size={16} className="transform rotate-180" />
          </button>
        </form>
      )}
    </div>
  );
};
