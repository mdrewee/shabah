import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { useAuth } from './context/AuthContext';

function RouteScrollReset() {
  const { pathname } = useLocation();
  React.useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const NameEntryView = React.lazy(() => import('./pages/NameEntryView').then(({ NameEntryView }) => ({ default: NameEntryView })));
const TVScreenView = React.lazy(() => import('./pages/TVScreenView').then(({ TVScreenView }) => ({ default: TVScreenView })));
const LetterRushDisplay = React.lazy(() => import('./pages/games/arabic/LetterRushStage').then(({ LetterRushDisplay }) => ({ default: LetterRushDisplay })));
const PlayerMobileView = React.lazy(() => import('./pages/PlayerMobileView').then(({ PlayerMobileView }) => ({ default: PlayerMobileView })));
const OfficeDashboard = React.lazy(() => import('./pages/OfficeDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const PropertyView = React.lazy(() => import('./pages/PropertyView'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));
const ShabahAccountPage=React.lazy(()=>import('./pages/ShabahAccountPage'));
const ShabahGamesPage=React.lazy(()=>import('./pages/ShabahGamesPage'));
const ShabahPolicyPage=React.lazy(()=>import('./pages/ShabahPolicyPage'));
const RoomSessionTools = React.lazy(() => import('./components/common/RoomSessionTools').then(module => ({ default: module.RoomSessionTools })));
const RoundTransitionNotice = React.lazy(() => import('./components/common/RoundTransitionNotice').then(module => ({ default: module.RoundTransitionNotice })));

function RoomChrome() {
  const { pathname } = useLocation();
  if (!/^\/(?:room\/[^/]+\/.+|game\/[^/]+\/[a-z0-9]{4}(?:\/.*)?)$/i.test(pathname)) return null;
  return <React.Suspense fallback={null}><RoundTransitionNotice /><RoomSessionTools /></React.Suspense>;
}

function AdminRoute() {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated && role === 'admin') return <AdminDashboard />;
  return <main dir="rtl" className="mx-auto max-w-[720px] p-8 text-center">
    <h1>الإدارة تتطلب حساب مسؤول</h1>
    <Link to="/login">تسجيل الدخول</Link>
  </main>;
}

export function App() {
  return (
    <Router>
      <RoomChrome />
      <RouteScrollReset />
      <React.Suspense fallback={<p role="status" dir="rtl">جاري التحميل…</p>}>
        <Routes>
          {/* Mayyaz Real Estate Routes */}
          <Route path="/office" element={<OfficeDashboard />} />
          <Route path="/dashboard" element={<OfficeDashboard />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/view/:propertyId" element={<PropertyView />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />

          {/* 1. Home View (Shabah Hero + Coverflow + Room Code Box) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/account" element={<ShabahAccountPage/>}/>
          <Route path="/games" element={<ShabahGamesPage/>}/>
          <Route path="/privacy" element={<ShabahPolicyPage kind="privacy"/>}/>
          <Route path="/terms" element={<ShabahPolicyPage kind="terms"/>}/>
          <Route path="/rights" element={<ShabahPolicyPage kind="rights"/>}/>

          {/* 2. Dedicated Name Entry Page (/enter-name?room=XXXX or /enter-name?game=YYYY) */}
          <Route path="/enter-name" element={<NameEntryView />} />
          <Route path="/join" element={<NameEntryView />} />
          <Route path="/room/:code/join" element={<NameEntryView />} />

          <Route path="/display/letter-rush/:code" element={<LetterRushDisplay />} />
          <Route path="/game/:gameId" element={<TVScreenView />} />
          <Route path="/game/:gameId/tv" element={<TVScreenView />} />
          <Route path="/game/:gameId/:code" element={<TVScreenView />} />
          <Route path="/game/:gameId/:code/tv" element={<TVScreenView />} />
          <Route path="/game/:gameId/play" element={<PlayerMobileView />} />
          <Route path="/game/:gameId/:code/play" element={<PlayerMobileView />} />

          {/* 4. Room Host / TV Views */}
          <Route path="/room/:code" element={<NameEntryView />} />
          <Route path="/room/:code/tv" element={<TVScreenView />} />
          <Route path="/room/:code/board" element={<TVScreenView />} />
          <Route path="/room/:code/football/draft-5-tv" element={<TVScreenView />} />
          <Route path="/room/:code/ai/the-scammer-tv" element={<TVScreenView />} />
          <Route path="/room/:code/words/scattergories-tv" element={<TVScreenView />} />
          <Route path="/room/:code/tourism-tv" element={<TVScreenView />} />
          <Route path="/room/:code/flying-tv" element={<TVScreenView />} />

          {/* 5. Contestant Mobile Views */}
          <Route path="/room/:code/play" element={<PlayerMobileView />} />
          <Route path="/room/:code/football/draft-5" element={<PlayerMobileView />} />
          <Route path="/room/:code/football/draft-5-play" element={<PlayerMobileView />} />
          <Route path="/room/:code/ai/the-scammer" element={<PlayerMobileView />} />
          <Route path="/room/:code/ai/the-scammer-play" element={<PlayerMobileView />} />
          <Route path="/room/:code/words/scattergories" element={<PlayerMobileView />} />
          <Route path="/room/:code/words/scattergories-play" element={<PlayerMobileView />} />
          <Route path="/room/:code/tourism-play" element={<PlayerMobileView />} />
          <Route path="/room/:code/flying" element={<PlayerMobileView />} />
          <Route path="/room/:code/flying-play" element={<PlayerMobileView />} />

          {/* Fallback */}
          <Route path="*" element={<main dir="rtl" className="p-8 text-center text-white"><h1>الصفحة غير موجودة</h1><Link to="/">العودة للرئيسية</Link></main>} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
