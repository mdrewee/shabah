import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const fullPhone = `+966${phoneDigits}`;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneDigits.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== 9 || !cleaned.startsWith('5')) {
      setError('يرجى إدخال رقم جوال صحيح يبدأ بـ 5 ويتكون من 9 أرقام (مثال: 501234567)');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStep(2);
      } else {
        setError(data.error || 'حدث خطأ أثناء إرسال الرمز');
      }
    } catch (err) {
      console.error(err);
      setError('تعذر الاتصال بخادم البوت. تأكد من تشغيل البوت.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('يرجى إدخال رمز تحقق مكون من 6 أرقام');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        login({
          phone: data.phone,
          role: data.role,
          officeId: data.officeId,
          token: data.token,
          subscriptionEndDate: data.subscriptionEndDate,
        });

        if (data.role === 'admin') {
          navigate('/admin');
        } else if (data.role === 'office') {
          // Check if office has completed profile
          if (!data.officeId) {
            navigate('/profile');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-100 p-3.5 rounded-2xl mb-4 text-emerald-700">
            <Home className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 text-center">منصة مياز العقارية</h1>
          <p className="text-xs text-slate-400 mt-1">تسجيل الدخول الموحد للمكاتب والإدارة</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl mb-6 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                رقم الجوال المسجل بالتيليجرام
              </label>
              
              {/* Locked Prefix +966 */}
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                <span className="px-4 py-3 bg-slate-100 border-l border-slate-200 text-slate-700 font-bold font-mono text-sm select-none" dir="ltr">
                  +966
                </span>
                <input
                  type="tel"
                  dir="ltr"
                  maxLength={9}
                  placeholder="5xxxxxxxx"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-transparent text-slate-900 font-bold font-mono text-base outline-none tracking-wider placeholder:font-normal placeholder:text-slate-300"
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 mr-1">اكتب الـ 9 أرقام بعد رمز الدولة (مثال: 530703441)</p>
            </div>

            <button
              type="submit"
              disabled={loading || phoneDigits.length < 9}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق عبر التيليجرام 📱'}
            </button>

            <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">
              سيصلك رمز تحقق مكون من 6 أرقام على حسابك في بوت مياز على التيليجرام
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">تم إرسال رمز التحقق إلى الرقم</p>
              <p className="font-bold text-slate-800 text-base font-mono" dir="ltr">{fullPhone}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                أدخل رمز التحقق (6 أرقام)
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-center text-2xl font-black font-mono tracking-widest text-slate-900 bg-slate-50 focus:bg-white"
                disabled={loading}
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'جاري التحقق...' : 'تحقق ودخول اللوحة 🚀'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full text-slate-500 hover:text-slate-800 font-bold py-2 rounded-xl transition-colors text-xs"
            >
              العودة وتغيير رقم الجوال
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
