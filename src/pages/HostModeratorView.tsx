import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Play,
  Users,
  LogOut,
  RotateCcw,
  ArrowRightLeft,
  UserX,
  Sparkles,
  MapPin,
  Globe2,
  Compass,
} from 'lucide-react';
import { useRoom, roomBus } from '../lib/roomBus';
import { ALL_GAME_MODES } from '../lib/gamesCatalog';
import { AvatarIcon } from '../components/common/AvatarIcon';
import { DemoSwitcher } from '../components/common/DemoSwitcher';
import { sound } from '../lib/audio';
import { TeamId } from '../types/game';
import { useSafeCountdown } from '../hooks/useSafeCountdown';
import { LandmarkScope } from '../types/landmarkGame';
import { getLandmarksByScope } from '../data/landmarks';

export const HostModeratorView: React.FC = () => {
  const params = useParams<{ code?: string; id?: string; roomId?: string }>();
  const roomId = (params.code || params.id || params.roomId || 'TAQ1').trim().toUpperCase();
  const navigate = useNavigate();

  const { room } = useRoom(roomId);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const isHost = sessionStorage.getItem(`taghesi_host_${roomId}`) === 'true';
    if (isHost) {
      setIsAuthenticated(true);
      roomBus.setHostStatus(roomId, true);
    }
  }, [roomId]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setIsAuthenticated(true);
    sessionStorage.setItem(`taghesi_host_${roomId}`, 'true');
    roomBus.setHostStatus(roomId, true);
  };

  // Start game from Lobby
  const handleStartGame = () => {
    roomBus.startGame(roomId);
  };

  // Swap team for a player
  const handleSwapTeam = (playerId: string) => {
    roomBus.swapPlayerTeam(roomId, playerId);
  };

  const handleKickPlayer = (playerId: string) => {
    roomBus.kickPlayer(roomId, playerId);
  };

  const handleOpenBuzzer = () => {
    roomBus.openBuzzer(roomId);
  };

  const handleEvaluate = (isCorrect: boolean, winnerId?: string) => {
    roomBus.evaluateAnswer(roomId, isCorrect, winnerId);
  };

  const handleRerollQuestion = () => {
    roomBus.rerollQuestion(roomId);
  };

  const handleLeave = () => {
    sound.playClick();
    roomBus.setHostStatus(roomId, false);
    sessionStorage.removeItem(`taghesi_host_${roomId}`);
    navigate(`/room/${roomId}/board`);
  };

  const isLobby = room?.status === 'lobby';
  const activeQuestion = room?.activeQuestion;
  const buzzerLock = room?.buzzerLock;
  const isReading = buzzerLock?.status === 'reading';
  const isBuzzerUnlocked = buzzerLock?.status === 'unlocked';
  const isBuzzed = buzzerLock?.status === 'buzzed';

  const secondsLeft = useSafeCountdown(buzzerLock?.endsAt);
  const displaySeconds = buzzerLock?.endsAt ? secondsLeft : (buzzerLock?.countdownRemaining ?? 0);

  const selectedGame =
    ALL_GAME_MODES.find((g) => g.id === room?.selectedGameId) || ALL_GAME_MODES[0];

  const teamAPlayers = room?.players.filter((p) => p.team === 'team_a') || [];
  const teamBPlayers = room?.players.filter((p) => p.team === 'team_b') || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-grain flex flex-col justify-between p-4 max-w-md mx-auto select-none">
        <header className="flex items-center justify-between border-b-2 border-ink-950 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-tactile bg-ochre-500 border-2 border-ink-950 shadow-tactile-sm flex items-center justify-center text-sand-50 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="font-black text-ink-950 font-display">لوحة المقدم</span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-sand-200 border border-ink-950 rounded">
            {roomId}
          </span>
        </header>

        <main className="my-auto py-6 card-tactile p-6 bg-sand-50">
          <div className="w-12 h-12 rounded-tactile bg-ochre-100 border-2 border-ink-950 shadow-tactile-sm flex items-center justify-center text-ochre-800 mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-black text-ink-950 mb-1">دخول شاشة المقدم</h2>
          <p className="text-xs text-ink-600 mb-4">
            تحكم كامل بإدارة الفرق، كشف الأسئلة والأجوبة، والتحكيم بين المتسابقين.
          </p>

          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <button
              type="submit"
              className="btn-tactile-secondary py-3 text-base font-bold flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>دخول كمدير جلسة</span>
            </button>
          </form>
        </main>

        <footer className="text-center text-xs text-ink-500 py-2">
          طق عصي — تحكيم الجلسة
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain flex flex-col justify-between max-w-md mx-auto p-4 select-none">
      {/* Top Status Bar */}
      <header className="card-tactile p-3 bg-sand-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-tactile bg-ochre-500 border-2 border-ink-950 shadow-tactile-sm flex items-center justify-center text-sand-50 font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-ink-950">شاشة المقدم (Host)</span>
            <span className="text-[10px] text-olive-800 font-bold">
              {isLobby ? 'مرحلة الردهة وتوزيع الفرق' : `الجولة ${room?.roundNumber || 1} • طور اللعب`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-sand-200 border border-ink-950 rounded text-xs font-mono font-bold">
            {roomId}
          </span>
          <button
            onClick={handleLeave}
            title="خروج"
            className="p-1 rounded border border-ink-950/20 hover:bg-sand-200 text-ink-600"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Host Content */}
      <main className="my-auto py-3 flex flex-col gap-4 w-full">
        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* 1. LOBBY HOST VIEW (إدارة المتسابقين وبدء اللعبة)            */}
        {/* ======================================================== */}
        {isLobby ? (
          <div className="flex flex-col gap-4">
            {selectedGame.id === 'geo-pin-landmark' ? (
              /* Solo Landmark Mode Lobby View */
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <span className="text-xs font-bold text-olive-800 bg-olive-100 px-3 py-0.5 rounded-full inline-block mb-1">
                    تحدي فردي (سولو)
                  </span>
                  <h2 className="text-xl font-black text-ink-950 font-display">
                    لوحة المشرف — حدد الموقع
                  </h2>
                  <p className="text-xs text-ink-600">
                    اللعب فردي ومفتوح لجميع المتسابقين بدون فرق
                  </p>
                </div>

                {/* Solo Players Card */}
                <div className="card-tactile p-4 bg-sand-50 border-2 border-ink-950 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-sand-300 pb-1.5">
                    <span className="text-xs font-black text-ink-950">
                      قائمة المتسابقين ({room?.players.length || 0})
                    </span>
                    <button
                      onClick={() => roomBus.addMockPlayer(roomId)}
                      className="px-2 py-0.5 rounded bg-olive-100 hover:bg-olive-200 border border-olive-800 text-[10px] font-bold text-olive-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ إضافة لاعب تجريبي</span>
                    </button>
                  </div>

                  {!room?.players || room.players.length === 0 ? (
                    <span className="text-xs text-ink-500 py-3 text-center font-bold">
                      بانتظار انضمام المتسابقين (أو أضف لاعب تجريبي)...
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {room.players.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 rounded bg-sand-100 border border-ink-950/20 flex items-center justify-between text-xs"
                        >
                          <span className="font-black text-ink-950">{p.name}</span>
                          <button
                            onClick={() => handleKickPlayer(p.id)}
                            title="طرد"
                            className="p-1 hover:bg-ochre-100 text-ink-400 hover:text-ochre-800 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scope Track Selector */}
                <div className="card-tactile p-4 bg-sand-50 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-ink-600">اختر مسار المعالم للجلسة:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => roomBus.setLandmarkScope(roomId, 'saudi')}
                      className={`p-3 rounded-tactile border-2 text-xs font-black flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        (room?.landmarkState?.scope || 'saudi') === 'saudi'
                          ? 'bg-olive-100 border-olive-900 text-olive-950 shadow-tactile-sm'
                          : 'bg-sand-100 border-sand-400 text-ink-800'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-olive-800" />
                      <span>معالم السعودية</span>
                    </button>
                    <button
                      onClick={() => roomBus.setLandmarkScope(roomId, 'world')}
                      className={`p-3 rounded-tactile border-2 text-xs font-black flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        room?.landmarkState?.scope === 'world'
                          ? 'bg-ochre-100 border-ochre-900 text-ochre-950 shadow-tactile-sm'
                          : 'bg-sand-100 border-sand-400 text-ink-800'
                      }`}
                    >
                      <Globe2 className="w-4 h-4 text-ochre-800" />
                      <span>معالم العالم</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    if (!room?.players || room.players.length === 0) {
                      roomBus.addMockPlayer(roomId);
                    }
                    setTimeout(() => {
                      roomBus.tvStartNextLandmarkRound(roomId, 1);
                    }, 100);
                  }}
                  className="w-full py-4 text-base font-black font-display flex items-center justify-center gap-2 rounded-tactile border-2 border-ink-950 shadow-tactile transition-all btn-tactile-primary cursor-pointer active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>ابدأ تحدي حدد الموقع (5 جولات)</span>
                </button>
              </div>
            ) : selectedGame.id === 'geo-blind-tourism' ? (
              /* Solo Blind Tourism Mode Lobby View */
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <span className="text-xs font-bold text-olive-800 bg-olive-100 px-3 py-0.5 rounded-full inline-block mb-1">
                    تحدي فردي (سولو)
                  </span>
                  <h2 className="text-xl font-black text-ink-950 font-display">
                    لوحة المشرف — سياحة عمياء
                  </h2>
                  <p className="text-xs text-ink-600">
                    5 جولات، 5 تلميحات تدريجية لكل جولة، وتثبيت أسرع لنقاط أعلى
                  </p>
                </div>

                {/* Solo Players Card */}
                <div className="card-tactile p-4 bg-sand-50 border-2 border-ink-950 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-sand-300 pb-1.5">
                    <span className="text-xs font-black text-ink-950">
                      قائمة المتسابقين ({room?.players.length || 0})
                    </span>
                    <button
                      onClick={() => roomBus.addMockPlayer(roomId)}
                      className="px-2 py-0.5 rounded bg-olive-100 hover:bg-olive-200 border border-olive-800 text-[10px] font-bold text-olive-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ إضافة لاعب تجريبي</span>
                    </button>
                  </div>

                  {!room?.players || room.players.length === 0 ? (
                    <span className="text-xs text-ink-500 py-3 text-center font-bold">
                      بانتظار انضمام المتسابقين (أو أضف لاعب تجريبي)...
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {room.players.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 rounded bg-sand-100 border border-ink-950/20 flex items-center justify-between text-xs"
                        >
                          <span className="font-black text-ink-950">{p.name}</span>
                          <button
                            onClick={() => handleKickPlayer(p.id)}
                            title="طرد"
                            className="p-1 hover:bg-ochre-100 text-ink-400 hover:text-ochre-800 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    if (!room?.players || room.players.length === 0) {
                      roomBus.addMockPlayer(roomId);
                    }
                    setTimeout(() => {
                      roomBus.tvStartNextTourismRound(roomId, 1);
                    }, 100);
                  }}
                  className="w-full py-4 text-base font-black font-display flex items-center justify-center gap-2 rounded-tactile border-2 border-ink-950 shadow-tactile transition-all btn-tactile-primary cursor-pointer active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>ابدأ تحدي سياحة عمياء (5 جولات)</span>
                </button>
              </div>
            ) : (
              /* Two-Team Letter Game Lobby View */
              <>
                <div className="text-center">
                  <h2 className="text-xl font-black text-ink-950 font-display">
                    إدارة المتسابقين وتوزيع الفرق
                  </h2>
                  <p className="text-xs text-ink-600">
                    انقر على زر النقل لتحويل أي لاعب للفريق الآخر قبل البدء
                  </p>
                </div>

                {/* Team 1 Management */}
                <div className="card-tactile p-4 bg-olive-50 border-2 border-olive-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-olive-800/20 pb-1.5">
                    <span className="text-xs font-black text-olive-950">
                      الفريق الأول ({teamAPlayers.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-olive-600 border border-ink-950"></span>
                      <span className="text-[10px] text-olive-800 font-bold">الفريق الأول</span>
                    </div>
                  </div>

                  {teamAPlayers.length === 0 ? (
                    <span className="text-xs text-olive-700/60 py-2 text-center font-bold">
                      لا يوجد لاعبين بعد في الفريق الأول
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {teamAPlayers.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 rounded bg-sand-50 border border-olive-900 flex items-center justify-between text-xs"
                        >
                          <span className="font-black text-ink-950">{p.name}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSwapTeam(p.id)}
                              title="نقل للفريق الثاني"
                              className="px-2 py-0.5 rounded bg-ochre-100 hover:bg-ochre-200 border border-ochre-800 text-[10px] font-bold text-ochre-900 flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>نقل للفريق الثاني</span>
                            </button>
                            <button
                              onClick={() => handleKickPlayer(p.id)}
                              title="طرد"
                              className="p-1 hover:bg-ochre-100 text-ink-400 hover:text-ochre-800"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team 2 Management */}
                <div className="card-tactile p-4 bg-ochre-50 border-2 border-ochre-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-ochre-800/20 pb-1.5">
                    <span className="text-xs font-black text-ochre-950">
                      الفريق الثاني ({teamBPlayers.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-ochre-600 border border-ink-950"></span>
                      <span className="text-[10px] text-ochre-800 font-bold">الفريق الثاني</span>
                    </div>
                  </div>

                  {teamBPlayers.length === 0 ? (
                    <span className="text-xs text-ochre-700/60 py-2 text-center font-bold">
                      لا يوجد لاعبين بعد في الفريق الثاني
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {teamBPlayers.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 rounded bg-sand-50 border border-ochre-900 flex items-center justify-between text-xs"
                        >
                          <span className="font-black text-ink-950">{p.name}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSwapTeam(p.id)}
                              title="نقل للفريق الأول"
                              className="px-2 py-0.5 rounded bg-olive-100 hover:bg-olive-200 border border-olive-800 text-[10px] font-bold text-olive-900 flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>نقل للفريق الأول</span>
                            </button>
                            <button
                              onClick={() => handleKickPlayer(p.id)}
                              title="طرد"
                              className="p-1 hover:bg-ochre-100 text-ink-400 hover:text-ochre-800"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Start Game Button (Requires >= 1 player per team) */}
                {!(teamAPlayers.length >= 1 && teamBPlayers.length >= 1) && (
                  <div className="text-center p-2 rounded bg-sand-100 border border-ink-950/20 text-xs font-bold text-ochre-800">
                    بانتظار انضمام لاعب في كل فريق لبدء المنافسة
                  </div>
                )}

                <button
                  onClick={handleStartGame}
                  disabled={!(teamAPlayers.length >= 1 && teamBPlayers.length >= 1)}
                  className={`w-full py-4 text-lg font-black font-display flex items-center justify-center gap-2 rounded-tactile border-2 border-ink-950 shadow-tactile transition-all ${
                    teamAPlayers.length >= 1 && teamBPlayers.length >= 1
                      ? 'btn-tactile-primary cursor-pointer'
                      : 'bg-sand-200 text-ink-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>ابدأ اللعبة الآن</span>
                </button>
              </>
            )}
          </div>
        ) : selectedGame.id === 'geo-pin-landmark' ? (
          /* Landmark Playing View on Host */
          <div className="card-tactile p-5 bg-sand-50 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-sand-300 pb-2">
              <span className="text-xs font-bold text-ink-600">
                الجولة {room?.landmarkState?.currentRound || 1} من 5
              </span>
              <span className="text-xs font-bold text-olive-800 bg-olive-100 px-2 py-0.5 rounded">
                {room?.landmarkState?.scope === 'world' ? 'معالم العالم' : 'معالم السعودية'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-ink-500 block mb-0.5">المعلم الحالي:</span>
              <h3 className="text-2xl font-black text-ink-950 font-display">
                {getLandmarksByScope(room?.landmarkState?.scope || 'saudi').find(
                  (l) => l.id === room?.landmarkState?.currentLandmarkId
                )?.name || 'المعلم'}
              </h3>
            </div>

            <div className="p-3 bg-olive-50 border-2 border-olive-800 rounded-tactile text-xs flex flex-col gap-1">
              <span className="font-bold text-olive-900">
                تم التثبيت:{' '}
                {
                  Object.values(room?.landmarkState?.players || {}).filter(
                    (p) => p.hasSubmitted
                  ).length
                }{' '}
                / {room?.players.length} لاعبين
              </span>
            </div>

            {room?.landmarkState?.gameState === 'PLAYING' && (
              <button
                onClick={() => roomBus.resolveLandmarkReveal(roomId)}
                className="btn-tactile-primary py-3 text-sm font-black mt-2"
              >
                كشف الإجابات وحساب المسافات فوراً
              </button>
            )}

            {room?.landmarkState?.gameState === 'ROUND_INTERMISSION' && (
              <button
                onClick={() =>
                  roomBus.tvStartNextLandmarkRound(
                    roomId,
                    (room?.landmarkState?.currentRound || 1) + 1
                  )
                }
                className="btn-tactile-primary py-3 text-sm font-black mt-2"
              >
                بدء الجولة التالية ◄
              </button>
            )}
          </div>
        ) : selectedGame.id === 'geo-blind-tourism' ? (
          /* Tourism Playing View on Host */
          <div className="card-tactile p-5 bg-sand-50 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-sand-300 pb-2">
              <span className="text-xs font-bold text-ink-600">
                الجولة {room?.tourismState?.currentRound || 1} من {room?.tourismState?.totalRounds || 5}
              </span>
              <span className="text-xs font-bold text-olive-800 bg-olive-100 px-2 py-0.5 rounded">
                التلميح {room?.tourismState?.currentStage || 1} من 5 ({6 - (room?.tourismState?.currentStage || 1)} pt)
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-ink-500 block mb-0.5">الوجهة المستهدفة (سري للمشرف):</span>
              <h3 className="text-2xl font-black text-ink-950 font-display">
                {room?.tourismState?.currentItem?.target || 'الوجهة'}
              </h3>
              {room?.tourismState?.currentItem?.type && (
                <span className="text-xs font-bold text-ochre-800 bg-ochre-100 px-2 py-0.5 rounded inline-block mt-1">
                  {room?.tourismState?.currentItem?.type}
                </span>
              )}
            </div>

            <div className="p-3 bg-sand-100 border border-sand-300 rounded-tactile text-xs flex flex-col gap-1">
              <span className="font-bold text-ink-900">
                التلميح النشط حالياً:
              </span>
              <p className="font-black text-ink-950 text-sm">
                {room?.tourismState?.currentItem?.hints[(room?.tourismState?.currentStage || 1) - 1] || ''}
              </p>
            </div>

            <div className="p-3 bg-olive-50 border-2 border-olive-800 rounded-tactile text-xs flex flex-col gap-1">
              <span className="font-bold text-olive-900">
                تم التثبيت:{' '}
                {
                  Object.values(room?.tourismState?.players || {}).filter(
                    (p) => p.hasLockedIn
                  ).length
                }{' '}
                / {room?.players.length} لاعبين
              </span>
            </div>

            {room?.tourismState?.gameState === 'PLAYING' && (
              <button
                onClick={() => roomBus.resolveTourismReveal(roomId)}
                className="btn-tactile-primary py-3 text-sm font-black mt-2"
              >
                كشف الإجابات وحساب النقاط فوراً
              </button>
            )}

            {room?.tourismState?.gameState === 'ROUND_INTERMISSION' && (
              <button
                onClick={() =>
                  roomBus.tvStartNextTourismRound(
                    roomId,
                    (room?.tourismState?.currentRound || 1) + 1
                  )
                }
                className="btn-tactile-primary py-3 text-sm font-black mt-2"
              >
                بدء الجولة التالية ◄
              </button>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* 2. PLAYING HOST VIEW (السؤال والإجابة والتحكيم الإلزامي) */
          /* ======================================================== */
          <div className="flex flex-col gap-4">
            {room?.activeCellId && activeQuestion ? (
              <>
                {/* Active Question Card */}
                <div className="card-tactile p-5 bg-sand-50 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-sand-300 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink-600">الحرف/الخلية:</span>
                      <span className="text-2xl font-black font-display text-olive-800 bg-olive-100 px-3 py-0.5 rounded border border-olive-800/30">
                        {activeQuestion.letter}
                      </span>
                    </div>

                    <button
                      onClick={handleRerollQuestion}
                      className="btn-tactile-ghost py-1 px-2 text-xs flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>تغيير السؤال</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-ink-500 block mb-1">
                      نص السؤال (اقرأه للمجلس):
                    </span>
                    <p className="text-base font-black text-ink-950 font-display leading-relaxed">
                      {activeQuestion.question}
                    </p>
                  </div>

                  {/* Bold Ochre Answer Pill */}
                  <div className="p-3 bg-ochre-100 border-2 border-ochre-800 rounded-tactile">
                    <span className="text-[10px] font-bold text-ochre-900 block mb-0.5">
                      الإجابة الصحيحة السرية:
                    </span>
                    <div className="text-lg font-black text-ochre-950 font-display flex items-center gap-2">
                      <span>{activeQuestion.answer}</span>
                      {activeQuestion.hintEnding && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-ochre-200 text-ochre-950 border border-ochre-900">
                          (ينتهي بـ: {activeQuestion.hintEnding})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Buzzer and Evaluation Controls */}
                <div className="card-tactile p-4 bg-sand-50 flex flex-col gap-3 text-center">
                  {isReading ? (
                    /* Step A: Reading -> Unlock Buzzer */
                    <div className="flex flex-col gap-2">
                      {buzzerLock?.attemptPhase === 'REROLL' && (
                        <div className="p-2 rounded bg-ochre-100 border border-ochre-800 text-xs font-black text-ochre-950">
                          إجابة غير صحيحة لكلا الفريقين — تم تغيير السؤال على نفس الحرف
                        </div>
                      )}
                      <button
                        onClick={handleOpenBuzzer}
                        className="w-full btn-tactile-secondary py-3.5 text-base flex items-center justify-center gap-2 font-display"
                      >
                        <Zap className="w-5 h-5 fill-current" />
                        <span>
                          {buzzerLock?.attemptPhase === 'REROLL'
                            ? 'افتح الجرس للجميع (سؤال جديد)'
                            : 'افتح الجرس للمتسابقين الآن'}
                        </span>
                      </button>
                    </div>
                  ) : isBuzzerUnlocked ? (
                    buzzerLock?.attemptPhase === 'REBOUND_TEAM_B' ? (
                      <div className="py-2 flex flex-col items-center gap-1.5">
                        <span className="text-xs font-black text-ochre-950 bg-ochre-100 px-3 py-1 rounded-full border border-ochre-800">
                          تحويل السؤال لـ {buzzerLock.buzzedTeam === 'team_a' ? 'الفريق الأول' : 'الفريق الثاني'} (ارتداد — 5 ثوانٍ)
                        </span>
                        <div className="w-12 h-12 rounded-full border-2 border-ink-950 bg-sand-200 flex items-center justify-center font-mono font-black text-2xl text-ochre-800 shadow-tactile-sm my-1">
                          {displaySeconds}s
                        </div>
                        <span className="text-xs text-ink-600 font-bold">
                          أي لاعب من الفريق المنافس يكبس الزر أو يجاوب
                        </span>
                      </div>
                    ) : (
                      <div className="py-2 flex flex-col items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-olive-500 animate-ping"></span>
                        <span className="text-sm font-black text-olive-800 font-display">
                          الجرس مفتوح.. بانتظار كبس المتسابقين!
                        </span>
                      </div>
                    )
                  ) : isBuzzed ? (
                    /* Step B: Buzzed -> Mandatory Evaluation Buttons with Freeze status */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-sand-300 pb-2">
                        <div className="text-right">
                          <span className="text-[10px] text-ink-500 font-bold block">
                            المحاولة {buzzerLock?.attemptNumber || 1} من 2 {buzzerLock?.attemptNumber === 2 ? '(ارتداد)' : '(الأولى)'}:
                          </span>
                          <span className="text-base font-black text-ink-950 font-display">
                            {buzzerLock?.buzzedPlayerName || (buzzerLock?.buzzedTeam === 'team_a' ? 'الفريق الأول' : 'الفريق الثاني')}
                          </span>
                        </div>

                        <div className="w-12 h-12 rounded-full border-2 border-ink-950 bg-sand-200 flex items-center justify-center font-mono font-black text-2xl text-ochre-800 shadow-tactile-sm">
                          {displaySeconds}s
                        </div>
                      </div>

                      {buzzerLock?.isFrozen && (
                        <div className="p-2 rounded bg-ochre-100 border border-ochre-800/40 text-xs font-black text-ochre-950 animate-pulse">
                          انتهى الوقت! قيّم إجابة المتسابق (✅ صح أو ❌ خطأ):
                        </div>
                      )}

                      {/* If rebound without explicit speaker chosen on phone yet, allow host to credit directly to specific team member */}
                      {buzzerLock?.buzzedTeam && !buzzerLock?.buzzedPlayerId && (
                        <div className="p-2.5 rounded bg-sand-100 border border-ink-950/20 text-xs">
                          <span className="font-bold text-ink-700 block mb-1.5">
                            المتحدث من {buzzerLock.buzzedTeam === 'team_a' ? 'الفريق الأول' : 'الفريق الثاني'}:
                          </span>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {(buzzerLock.buzzedTeam === 'team_a' ? teamAPlayers : teamBPlayers).map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => handleEvaluate(true, pl.id)}
                                className="px-2.5 py-1 rounded bg-sand-50 hover:bg-sand-200 border border-ink-950 text-xs font-bold"
                              >
                                {pl.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mandatory Two Action Buttons */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          onClick={() => handleEvaluate(true)}
                          className="btn-tactile-primary py-3.5 text-sm flex items-center justify-center gap-1 font-bold"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✅ صح (احتساب)</span>
                        </button>

                        <button
                          onClick={() => handleEvaluate(false)}
                          className="btn-tactile-secondary py-3.5 text-sm flex items-center justify-center gap-1 font-bold bg-ochre-700 hover:bg-ochre-800"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>❌ خطأ ({buzzerLock?.attemptNumber === 1 ? 'تحويل' : 'إلغاء'})</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : room?.cellPickerPlayerId ? (
              <div className="card-tactile p-6 bg-olive-50 border-2 border-olive-800 text-center flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-olive-700" />
                <h3 className="text-lg font-black text-ink-950 font-display">
                  إجابة صحيحة!
                </h3>
                <p className="text-xs text-ink-700">
                  {room.cellPickerPlayerName} يختار الخلية القادمة من جواله..
                </p>
              </div>
            ) : (
              <div className="card-tactile p-6 bg-sand-50 text-center flex flex-col items-center gap-3">
                <h3 className="text-lg font-black text-ink-950 font-display">
                  بانتظار اختيار الخلية القادمة
                </h3>
                <p className="text-xs text-ink-600 max-w-xs">
                  يتم اختيار الخلية القادمة حصراً من جوال المتسابق الفائز. بمجرد اختيارها سيظهر لك السؤال والإجابة هنا مباشرة للتحكيم.
                </p>
                <button
                  onClick={() => roomBus.resetBoard(roomId)}
                  className="btn-tactile-ghost py-2 px-3 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بدء جولة جديدة وإعادة خلط اللوحة</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="card-tactile p-2.5 bg-sand-50 text-center text-xs text-ink-600 font-bold flex items-center justify-between">
        <span>كود الغرفة: <span className="font-mono text-ink-950">{roomId}</span></span>
        <button
          onClick={() => {
            roomBus.createRoom(roomId, room?.selectedGameId);
          }}
          className="text-[11px] font-bold text-ink-700 hover:underline"
        >
          العودة للردهة
        </button>
      </footer>

      {/* Demo Switcher */}
      <DemoSwitcher roomId={roomId} currentRole="host" />
    </div>
  );
};
