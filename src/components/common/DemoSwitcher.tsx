import React, { useState } from 'react';
import { Tv, Smartphone, ShieldCheck, UserPlus, ExternalLink, ChevronUp, ChevronDown, Copy, Check } from 'lucide-react';
import { roomBus } from '../../lib/roomBus';

interface DemoSwitcherProps {
  roomId: string;
  currentRole: 'tv' | 'player' | 'host';
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({ roomId, currentRole }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const openTab = (path: string) => {
    window.open(path, '_blank');
  };

  const handleAddMockPlayer = () => {
    roomBus.addMockPlayer(roomId);
  };

  const copyRoomLink = () => {
    const playUrl = `${window.location.origin}/room/${roomId}/play`;
    navigator.clipboard.writeText(playUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <aside aria-label="شريط أدوات الاختبار والمحاكاة" className="fixed bottom-3 right-3 z-50 select-none">
      <div className="bg-sand-50 border-2 border-ink-950 rounded-tactile shadow-tactile-md overflow-hidden max-w-sm transition-all">
        {/* Toggle header */}
        <div className="px-3 py-2 bg-sand-200 border-b-2 border-ink-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-olive-500 animate-pulse"></span>
            <span className="text-xs font-bold text-ink-900">أدوات تجربة وتوزيع الأدوار</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sand-300 font-mono text-ink-700">
              {currentRole === 'tv' ? 'شاشة العرض' : currentRole === 'player' ? 'يد اللاعب' : 'شاشة المشرف'}
            </span>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'توسيع شريط أدوات الاختبار' : 'طي شريط أدوات الاختبار'}
            className="p-1 hover:bg-sand-300 rounded text-ink-800"
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-3 flex flex-col gap-2 text-xs">
            <div className="text-[11px] text-ink-600 leading-tight">
              جرّب فتح شاشات متعددة في تبويبات منفصلة لمشاهدة التزامن الفوري:
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => openTab(`/room/${roomId}/board`)}
                disabled={currentRole === 'tv'}
                className={`flex flex-col items-center justify-center p-2 rounded-md border-2 border-ink-950 text-center gap-1 transition-all ${
                  currentRole === 'tv'
                    ? 'bg-olive-100 text-olive-900 border-olive-900 font-bold opacity-80 cursor-default'
                    : 'bg-sand-100 hover:bg-sand-200 text-ink-900 active:translate-y-0.5'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span className="text-[11px]">التلفزيون</span>
              </button>

              <button
                onClick={() => openTab(`/room/${roomId}/play`)}
                className={`flex flex-col items-center justify-center p-2 rounded-md border-2 border-ink-950 text-center gap-1 transition-all ${
                  currentRole === 'player'
                    ? 'bg-olive-100 text-olive-900 border-olive-900 font-bold'
                    : 'bg-sand-100 hover:bg-sand-200 text-ink-900 active:translate-y-0.5'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[11px]">لاعب جديد</span>
              </button>

              <button
                onClick={() => openTab(`/room/${roomId}/host`)}
                disabled={currentRole === 'host'}
                className={`flex flex-col items-center justify-center p-2 rounded-md border-2 border-ink-950 text-center gap-1 transition-all ${
                  currentRole === 'host'
                    ? 'bg-ochre-100 text-ochre-900 border-ochre-900 font-bold opacity-80 cursor-default'
                    : 'bg-sand-100 hover:bg-sand-200 text-ink-900 active:translate-y-0.5'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px]">المشرف</span>
              </button>
            </div>

            <div className="pt-1 flex items-center gap-1.5">
              <button
                onClick={handleAddMockPlayer}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-olive-500 hover:bg-olive-600 text-sand-50 rounded-md border-2 border-ink-950 font-bold shadow-tactile-sm active:translate-y-0.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ لاعب تجريبي</span>
              </button>

              <button
                onClick={copyRoomLink}
                title="نسخ رابط دخول اللاعبين"
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-sand-200 hover:bg-sand-300 text-ink-900 rounded-md border-2 border-ink-950 shadow-tactile-sm active:translate-y-0.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-olive-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>رابط اللعب</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
