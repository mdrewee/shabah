import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';

export function LobbyModePicker<Mode extends string>({ modes, selected, onSelect, disabled }: {
  modes: ReadonlyArray<{ id: Mode; label: string; icon: LucideIcon }>;
  selected?: Mode;
  onSelect?: (mode: Mode) => void;
  disabled?: boolean;
}) {
  return <div className="flex w-full select-none flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-black text-neutral-800">{onSelect ? 'اختر طور التحدي' : 'المضيف يختار طور التحدي'}</span>
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-black text-neutral-600">
        الحد الأقصى ١٠ لاعبين
      </span>
    </div>
    <div className="grid w-full grid-cols-2 gap-2.5">
      {modes.map(({ id, label, icon: Icon }) => (
        <button type="button" key={id} disabled={disabled || !onSelect}
          aria-pressed={selected === id}
          onClick={() => onSelect?.(id)}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-2 py-3 transition-all enabled:cursor-pointer enabled:active:scale-95 sm:px-4 ${
            selected === id
              ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-[2px_2px_0px_#0A0A0A] ring-2 ring-emerald-400'
              : 'border-neutral-300 bg-white text-[#0A0A0A] enabled:hover:border-neutral-400'
          }`}>
          <Icon className="h-5 w-5 shrink-0" />
          <span className="text-xs font-black sm:text-sm">{label}</span>
          {selected === id && <Check className="h-4 w-4 shrink-0 stroke-[3] text-emerald-400" />}
        </button>
      ))}
    </div>
  </div>;
}
