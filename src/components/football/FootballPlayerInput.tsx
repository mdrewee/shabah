import React, { useState, useEffect, useRef, FC, KeyboardEvent } from 'react';
import { FootballPlayer } from '../../data/footballMasterData';
import { searchFootballPlayers } from '../../utils/footballSearch';

export interface FootballPlayerInputProps {
  onSelectPlayer: (player: FootballPlayer) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  clearOnSelect?: boolean;
  maxResults?: number;
}

// Convert 2-letter ISO code to flag emoji
function getCountryFlagEmoji(code: string): string {
  if (!code || code.length < 2) return '⚽';
  // Handle UK subdivisions like GB-ENG
  if (code.startsWith('GB-')) {
    if (code === 'GB-ENG') return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    if (code === 'GB-SCT') return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
    if (code === 'GB-WLS') return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
  }
  const country = code.slice(0, 2).toUpperCase();
  const codePoints = [...country].map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const POSITION_LABELS: Record<FootballPlayer['position'], { label: string; bg: string }> = {
  GK: { label: 'حارس', bg: 'bg-amber-100 text-amber-800 border-amber-800' },
  DEF: { label: 'دفاع', bg: 'bg-blue-100 text-blue-800 border-blue-800' },
  MID: { label: 'وسط', bg: 'bg-emerald-100 text-emerald-800 border-emerald-800' },
  FWD: { label: 'هجوم', bg: 'bg-rose-100 text-rose-800 border-rose-800' },
};

export const FootballPlayerInput: FC<FootballPlayerInputProps> = ({
  onSelectPlayer,
  placeholder = 'ابحث عن لاعب (مثلاً: بنزيما، سالم، الدون...)...',
  className = '',
  autoFocus = false,
  disabled = false,
  clearOnSelect = true,
  maxResults = 7,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FootballPlayer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live search as user types (1-2 chars threshold)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 1) {
      const hits = searchFootballPlayers(trimmed, maxResults);
      setResults(hits);
      setIsOpen(hits.length > 0);
      setSelectedIndex(hits.length > 0 ? 0 : -1);
    } else {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [query, maxResults]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (player: FootballPlayer) => {
    onSelectPlayer(player);
    if (clearOnSelect) {
      setQuery('');
      setResults([]);
      setIsOpen(false);
    } else {
      setQuery(player.name);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} dir="rtl">
      {/* Input Field */}
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className="w-full bg-[#F7F4EC] text-[#2C2A29] placeholder-[#8A8580] px-4 py-3.5 pr-11 pl-10 text-base md:text-lg font-bold border-2 border-[#2C2A29] rounded-xl shadow-[4px_4px_0px_#2C2A29] focus:outline-none focus:ring-2 focus:ring-[#8A9A5B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Search Icon (RTL Right side) */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2C2A29] pointer-events-none">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear Button (RTL Left side) */}
        {query.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8580] hover:text-[#2C2A29] transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-2 bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-xl shadow-[6px_6px_0px_#2C2A29] overflow-hidden max-h-72 overflow-y-auto divide-y-2 divide-[#2C2A29]/10"
          role="listbox"
        >
          {results.map((player, idx) => {
            const isSelected = idx === selectedIndex;
            const pos = POSITION_LABELS[player.position] || { label: player.position, bg: 'bg-gray-100 text-gray-800 border-gray-800' };
            const flag = getCountryFlagEmoji(player.nationalityCode);

            return (
              <li
                key={player.id}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(player)}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                  isSelected
                    ? 'bg-[#8A9A5B] text-white'
                    : 'bg-[#F7F4EC] text-[#2C2A29] hover:bg-[#E5E0D5]'
                }`}
              >
                {/* Left/Main: Player Name & Flag */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0 select-none">{flag}</span>
                  <div className="truncate">
                    <span className="font-extrabold text-base md:text-lg block truncate">
                      {player.name}
                    </span>
                    <span className={`text-xs block truncate ${isSelected ? 'text-white/80' : 'text-[#7A7570]'}`}>
                      {player.nationality} {player.currentClub && player.currentClub !== 'معتزل' ? `• ${player.currentClub}` : '• معتزل'}
                    </span>
                  </div>
                </div>

                {/* Right: Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Position Badge */}
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded border ${
                      isSelected
                        ? 'bg-white/20 text-white border-white/40'
                        : pos.bg
                    }`}
                  >
                    {pos.label}
                  </span>

                  {/* Club Badge */}
                  {player.currentClub && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border hidden sm:inline-block ${
                        isSelected
                          ? 'bg-white/10 text-white border-white/30'
                          : 'bg-[#E5E0D5] text-[#2C2A29] border-[#2C2A29]/20'
                      }`}
                    >
                      {player.currentClub}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
