import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Building, ShieldCheck, MapPin, CheckCircle2, ArrowRight, Save, LogOut, Sparkles, Calendar, Layers } from 'lucide-react';

export const SAUDI_13_REGIONS = [
  'الرياض',
  'مكة المكرمة',
  'المدينة المنورة',
  'الشرقية',
  'القصيم',
  'عسير',
  'تبوك',
  'حائل',
  'الحدود الشمالية',
  'الجوف',
  'جازان',
  'نجران',
  'الباحة'
];

export default function ProfilePage() {
  const { phone, role, officeId, logout, login } = useAuth();
  const navigate = useNavigate();

  const [officeName, setOfficeName] = useState('');
  const [falLicense, setFalLicense] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [propertyCount, setPropertyCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOfficeData();
  }, [officeId, phone]);

  const fetchOfficeData = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase.from('offices').select('*');
      if (officeId) {
        query = query.eq('id', officeId);
      } else if (phone) {
        query = query.eq('phone', phone);
      }

      const { data: office, error: fetchErr } = await query.maybeSingle();

      if (office) {
        setOfficeName(office.name || '');
        setFalLicense(office.fal_license || '');
        setSelectedRegions(office.covered_regions || []);
        setSubscriptionStatus(office.subscription_status || 'trial');
        setTrialEndsAt(office.trial_ends_at);

        // Fetch properties count
        const { count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('office_id', office.id);
        
        setPropertyCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!officeName.trim()) {
      setError('يرجى إدخال اسم المنشأة أو المكتب العقاري');
      return;
    }
    if (!falLicense.trim()) {
      setError('يرجى إدخال رقم رخصة فال العقارية المعتمدة');
      return;
    }
    if (selectedRegions.length === 0) {
      setError('يرجى اختيار منطقة واحدة مخدومة على الأقل');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: officeName.trim(),
        fal_license: falLicense.trim(),
        covered_regions: selectedRegions,
        phone: phone,
      };

      let currentOfficeId = officeId;

      if (officeId) {
        const { error: updateErr } = await supabase
          .from('offices')
          .update(payload)
          .eq('id', officeId);
        if (updateErr) throw updateErr;
      } else {
        const { data: created, error: insertErr } = await supabase
          .from('offices')
          .upsert(payload, { onConflict: 'phone' })
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        if (created) currentOfficeId = created.id;
      }

      if (phone) {
        login({
          phone: phone,
          role: role || 'office',
          officeId: currentOfficeId,
        });
      }

      setSuccess('تم حفظ الملف التعريفي بنجاح!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-900/30 sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors text-white"
              title="العودة للوحة التحكم"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">الملف التعريفي للمكتب</h1>
              <p className="text-xs text-slate-400">إدارة بيانات المنشأة والمناطق المخدومة</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Subscription Status Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/30 inline-flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                حالة الحساب والاشتراك
              </span>
              <h2 className="text-2xl font-black text-white">
                {subscriptionStatus === 'active' ? 'باقة مياز المتقدمة 🌟' : 'فترة تجريبية مجانية (30 يوم) 🚀'}
              </h2>
              <p className="text-xs text-emerald-200/80 mt-1">تمتع بنشر وإدارة إعلاناتك العقارية والوصول المباشر لعملاء التيليجرام</p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl text-center border border-white/10">
                <p className="text-[11px] text-emerald-200 font-medium">العقارات المنشورة</p>
                <p className="text-xl font-black text-white mt-0.5">{propertyCount}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl text-center border border-white/10">
                <p className="text-[11px] text-emerald-200 font-medium">انتهاء الصلاحية</p>
                <p className="text-xs font-bold text-white mt-1.5">
                  {trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('ar-SA') : 'مستمر'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Grid 2 Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Office Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  اسم المكتب / المنشأة العقارية <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: مكتب القمة العقاري المعتمد"
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* FAL License */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  رقم رخصة فال العقارية <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: 1200012345"
                    value={falLicense}
                    onChange={(e) => setFalLicense(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10"
                  />
                  <ShieldCheck className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Covered Regions (13 Saudi Regions) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  المناطق المخدومة (المناطق الـ 13 بالمملكة) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">اختر منطقة أو أكثر</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {SAUDI_13_REGIONS.map((region) => {
                  const isSelected = selectedRegions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all text-right flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{region}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 text-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ الملف التعريفي والبدء'}</span>
              </button>
            </div>

          </form>

        </div>

      </main>

    </div>
  );
}
