import React from 'react';
import { Users, CheckCircle2, ArrowLeft } from 'lucide-react';
import { EshrahPlayer, EshrahTeamId } from '../../types/eshrah';
import { sound } from '../../lib/audio';

interface CleanTeamSelectionProps {
  players: EshrahPlayer[];
  currentUserId?: string;
  isHost?: boolean;
  onJoinTeam: (teamId: EshrahTeamId) => void;
  onConfirmTeams: () => void;
  minPlayersPerTeam?: number;
}

export const CleanTeamSelection: React.FC<CleanTeamSelectionProps> = ({
  players,
  currentUserId,
  isHost = false,
  onJoinTeam,
  onConfirmTeams,
  minPlayersPerTeam = 1
}) => {
  const team1Players = players.filter((p) => p.teamId === 'team_1');
  const team2Players = players.filter((p) => p.teamId === 'team_2');
  const unassignedPlayers = players.filter((p) => !p.teamId);

  const canProceed =
    team1Players.length >= minPlayersPerTeam && team2Players.length >= minPlayersPerTeam;

  const handleSelectTeam = (teamId: EshrahTeamId) => {
    sound.playClick();
    onJoinTeam(teamId);
  };

  const handleProceed = () => {
    if (!canProceed) return;
    sound.playClick();
    onConfirmTeams();
  };

  const myTeamId = players.find((p) => p.id === currentUserId)?.teamId;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-4 px-2 select-none" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black text-[#2C2A29] tracking-tight">
          اختيار الفرق
        </h2>
        <p className="text-xs md:text-sm font-bold text-[#5C4033] mt-1">
          اضغط مباشرة للانضمام إلى فريقك (يلزم متسابق على الأقل في كل فريق)
        </p>
      </div>

      {/* 2 Brutalist Team Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Team 1: Olivine Green (#8A9A5B) */}
        <div
          onClick={() => handleSelectTeam('team_1')}
          className={`relative bg-[#F7F4EC] border-2 rounded-2xl p-5 shadow-[4px_4px_0px_#2C2A29] flex flex-col justify-between transition-all cursor-pointer ${
            myTeamId === 'team_1'
              ? 'border-[#8A9A5B] ring-2 ring-[#8A9A5B] bg-[#8A9A5B]/10'
              : 'border-[#2C2A29] hover:-translate-y-1'
          }`}
        >
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-[#2C2A29]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#8A9A5B] border border-[#2C2A29]" />
                <h3 className="text-xl font-black text-[#2C2A29]">الفريق الأول</h3>
              </div>
              <span className="text-xs font-black bg-[#8A9A5B] text-white px-2.5 py-1 rounded-xl border border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]">
                {team1Players.length} لاعبين
              </span>
            </div>

            <div className="space-y-2 min-h-[140px]">
              {team1Players.length === 0 ? (
                <div className="text-xs font-bold text-[#5C4033]/60 text-center py-10">
                  اضغط هنا للانضمام للفريق الأول
                </div>
              ) : (
                team1Players.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center px-3 py-2 rounded-xl border-2 border-[#2C2A29] bg-[#E5E0D5] text-xs font-black text-[#2C2A29]"
                  >
                    <span>{p.name} {p.id === currentUserId ? '(أنت)' : ''}</span>
                    <span className="text-[10px] text-[#8A9A5B] font-bold">عضو</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTeam('team_1');
            }}
            className={`w-full mt-4 py-2.5 rounded-xl font-black text-xs border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] transition-all cursor-pointer ${
              myTeamId === 'team_1'
                ? 'bg-[#8A9A5B] text-white'
                : 'bg-[#F7F4EC] text-[#2C2A29] hover:bg-[#8A9A5B] hover:text-white'
            }`}
          >
            {myTeamId === 'team_1' ? 'أنت في الفريق الأول ✓' : 'انضم للفريق الأول'}
          </button>
        </div>

        {/* Team 2: Ochre Orange (#C68B59) */}
        <div
          onClick={() => handleSelectTeam('team_2')}
          className={`relative bg-[#F7F4EC] border-2 rounded-2xl p-5 shadow-[4px_4px_0px_#2C2A29] flex flex-col justify-between transition-all cursor-pointer ${
            myTeamId === 'team_2'
              ? 'border-[#C68B59] ring-2 ring-[#C68B59] bg-[#C68B59]/10'
              : 'border-[#2C2A29] hover:-translate-y-1'
          }`}
        >
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-[#2C2A29]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#C68B59] border border-[#2C2A29]" />
                <h3 className="text-xl font-black text-[#2C2A29]">الفريق الثاني</h3>
              </div>
              <span className="text-xs font-black bg-[#C68B59] text-white px-2.5 py-1 rounded-xl border border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]">
                {team2Players.length} لاعبين
              </span>
            </div>

            <div className="space-y-2 min-h-[140px]">
              {team2Players.length === 0 ? (
                <div className="text-xs font-bold text-[#5C4033]/60 text-center py-10">
                  اضغط هنا للانضمام للفريق الثاني
                </div>
              ) : (
                team2Players.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center px-3 py-2 rounded-xl border-2 border-[#2C2A29] bg-[#E5E0D5] text-xs font-black text-[#2C2A29]"
                  >
                    <span>{p.name} {p.id === currentUserId ? '(أنت)' : ''}</span>
                    <span className="text-[10px] text-[#C68B59] font-bold">عضو</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTeam('team_2');
            }}
            className={`w-full mt-4 py-2.5 rounded-xl font-black text-xs border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] transition-all cursor-pointer ${
              myTeamId === 'team_2'
                ? 'bg-[#C68B59] text-white'
                : 'bg-[#F7F4EC] text-[#2C2A29] hover:bg-[#C68B59] hover:text-white'
            }`}
          >
            {myTeamId === 'team_2' ? 'أنت في الفريق الثاني ✓' : 'انضم للفريق الثاني'}
          </button>
        </div>
      </div>

      {/* Unassigned Players Info */}
      {unassignedPlayers.length > 0 && (
        <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-3 shadow-[2px_2px_0px_#2C2A29] text-center">
          <span className="text-xs font-bold text-[#5C4033]">
            بانتظار اختيار الفرق ({unassignedPlayers.length}):{' '}
          </span>
          <span className="text-xs font-black text-[#2C2A29]">
            {unassignedPlayers.map((p) => p.name).join('، ')}
          </span>
        </div>
      )}

      {/* Action Button (Host Only or General Proceed) */}
      <div className="pt-2">
        <button
          disabled={!canProceed}
          onClick={handleProceed}
          className={`w-full py-4 rounded-2xl font-black text-base md:text-lg border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] transition-all flex items-center justify-center gap-2 ${
            canProceed
              ? 'bg-[#8A9A5B] text-white hover:bg-[#78884e] active:translate-y-0.5 cursor-pointer'
              : 'bg-[#E5E0D5] text-[#2C2A29]/40 border-[#2C2A29]/40 shadow-none cursor-not-allowed'
          }`}
        >
          <span>اختيار الفئات وبدء اللعب</span>
          <ArrowLeft size={18} />
        </button>
      </div>
    </div>
  );
};
