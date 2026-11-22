import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';

function RouteScrollReset() {
  const { pathname } = useLocation();
  React.useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const NameEntryView = React.lazy(() => import('./pages/NameEntryView').then(({ NameEntryView }) => ({ default: NameEntryView })));
const TVScreenView = React.lazy(() => import('./pages/TVScreenView').then(({ TVScreenView }) => ({ default: TVScreenView })));
const PlayerMobileView = React.lazy(() => import('./pages/PlayerMobileView').then(({ PlayerMobileView }) => ({ default: PlayerMobileView })));
const OfficeDashboard = React.lazy(() => import('./pages/OfficeDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const PropertyView = React.lazy(() => import('./pages/PropertyView'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));

export function App() {
  return (
    <Router>
      <RouteScrollReset />
      <React.Suspense fallback={<p role="status" dir="rtl">جاري التحميل…</p>}>
        <Routes>
          {/* Mayyaz Real Estate Routes */}
          <Route path="/office" element={<OfficeDashboard />} />
          <Route path="/dashboard" element={<OfficeDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/view/:propertyId" element={<PropertyView />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />

          {/* 1. Home View (Shabah Hero + Coverflow 5 Games + Room Code Box) */}
          <Route path="/" element={<LandingPage />} />

          {/* 2. Dedicated Name Entry Page (/enter-name?room=XXXX or /enter-name?game=YYYY) */}
          <Route path="/enter-name" element={<NameEntryView />} />
          <Route path="/join" element={<NameEntryView />} />
          <Route path="/room/:code/join" element={<NameEntryView />} />

          {/* 3. Official 5 Shabah Games Routes (/game/ai-judge, /game/ai-coach, /game/ai-broker, /game/ai-arabic, /game/ai-guide) */}
          <Route path="/game/:gameId" element={<TVScreenView />} />
          <Route path="/game/:gameId/tv" element={<TVScreenView />} />
          <Route path="/game/:gameId/:code" element={<TVScreenView />} />
          <Route path="/game/:gameId/:code/tv" element={<TVScreenView />} />
          <Route path="/game/:gameId/play" element={<PlayerMobileView />} />
          <Route path="/game/:gameId/:code/play" element={<PlayerMobileView />} />

          {/* 4. Room Host / TV Views for the 5 Games */}
          <Route path="/room/:code" element={<TVScreenView />} />
          <Route path="/room/:code/tv" element={<TVScreenView />} />
          <Route path="/room/:code/board" element={<TVScreenView />} />
          <Route path="/room/:code/ai/ai-lawyer-tv" element={<TVScreenView />} />
          <Route path="/room/:code/football/draft-5-tv" element={<TVScreenView />} />
          <Route path="/room/:code/ai/the-scammer-tv" element={<TVScreenView />} />
          <Route path="/room/:code/words/scattergories-tv" element={<TVScreenView />} />
          <Route path="/room/:code/tourism-tv" element={<TVScreenView />} />
          <Route path="/room/:code/flying-tv" element={<TVScreenView />} />

          {/* 5. Contestant Mobile Views for the 5 Games */}
          <Route path="/room/:code/play" element={<PlayerMobileView />} />
          <Route path="/room/:code/ai/ai-lawyer" element={<PlayerMobileView />} />
          <Route path="/room/:code/ai/ai-lawyer-play" element={<PlayerMobileView />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
