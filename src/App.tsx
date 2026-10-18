import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { NameEntryView } from './pages/NameEntryView';
import { TVScreenView } from './pages/TVScreenView';
import { PlayerMobileView } from './pages/PlayerMobileView';
import OfficeDashboard from './pages/OfficeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PropertyView from './pages/PropertyView';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';

export function App() {
  return (
    <Router>
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
        <Route path="/game/:gameId/:code" element={<TVScreenView />} />

        {/* 4. Room Host / TV Views for the 5 Games */}
        <Route path="/room/:code" element={<TVScreenView />} />
        <Route path="/room/:code/board" element={<TVScreenView />} />
        <Route path="/room/:code/ai/ai-lawyer-tv" element={<TVScreenView />} />
        <Route path="/room/:code/football/draft-5-tv" element={<TVScreenView />} />
        <Route path="/room/:code/ai/the-scammer-tv" element={<TVScreenView />} />
        <Route path="/room/:code/words/scattergories-tv" element={<TVScreenView />} />
        <Route path="/room/:code/tourism-tv" element={<TVScreenView />} />

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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
