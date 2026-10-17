import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building, Home, MapPin, Sparkles } from 'lucide-react';
import MapComponent from '../components/MapComponent';

export default function MapPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" dir="rtl">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <span>مَيَّاز العقارية</span>
              <span className="text-[11px] font-bold bg-emerald-500 text-slate-900 px-2 py-0.5 rounded-full">
                الخريطة التفاعلية
              </span>
            </h1>
            <p className="text-xs text-slate-400">استعراض العقارات ومخططات الأراضي عبر خريطة Mapbox التفاعلية</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-2xl text-xs font-bold transition-all border border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>لوحة التحكم</span>
          </button>
        </div>
      </header>

      {/* Main Map Container */}
      <main className="flex-1 p-4 flex flex-col">
        <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          <MapComponent height="calc(100vh - 110px)" initialCity="الأحساء" />
        </div>
      </main>
    </div>
  );
}
