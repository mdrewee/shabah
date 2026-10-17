import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, ShieldCheck, Sparkles, Building2, User, Copy, ArrowRight, Upload } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  isPopular?: boolean;
  audience: 'client' | 'office';
  features: string[];
}

const CLIENT_PLANS: Plan[] = [
  {
    id: 'client_monthly',
    name: 'باقة الشهر',
    price: 99,
    duration: 'شهر واحد',
    audience: 'client',
    features: ['بحث عقاري غير محدود طوال الشهر', 'تنبيهات فورية بالعقارات الجديدة', 'دعم فني مخصص', 'استعلام مباشر عن المعالم والمسافات']
  },
  {
    id: 'client_quarterly',
    name: 'باقة 3 شهور',
    price: 249,
    duration: '3 شهور',
    audience: 'client',
    features: ['وفر 16% مقارنة بالشهري', 'بحث عقاري غير محدود', 'تنبيهات العقارات الفورية', 'دعم فني بأولوية عالية']
  },
  {
    id: 'client_yearly',
    name: 'باقة السنة',
    price: 990,
    duration: 'سنة كاملة',
    isPopular: true,
    audience: 'client',
    features: ['وفر 20% (أفضل قيمة)', 'بحث غير محدود لمدة 365 يوم', 'أولوية الوصول للعقارات الحصرية', 'تقارير مؤشرات الأسعار والتحليلات']
  }
];

const OFFICE_PLANS: Plan[] = [
  {
    id: 'office_monthly',
    name: 'باقة المكتب الشهري',
    price: 149,
    duration: 'شهر واحد',
    audience: 'office',
    features: ['إضافة حتى 100 عقار نشط', 'ظهور وتكامل مباشر في بوت مَيَّاز', 'لوحة تحكم سحابية لإدارة العقارات', 'دعم فني متكامل']
  },
  {
    id: 'office_quarterly',
    name: 'باقة المكتب ربع سنوي',
    price: 399,
    duration: '3 شهور',
    audience: 'office',
    features: ['وفر 11%', 'إضافة حتى 250 عقار نشط', 'إحصائيات وتحليلات المشاهدات والطلبات', 'دعم فني ذو أولوية قصوى']
  },
  {
    id: 'office_yearly',
    name: 'باقة المكتب السنوي',
    price: 1499,
    duration: 'سنة كاملة',
    isPopular: true,
    audience: 'office',
    features: ['وفر 16% (الأكثر طلباً)', 'إضافة حتى 1000 عقار نشط', 'ترويج العقارات المميزة في أعلى النتائج', 'مدير حساب مخصص', 'شارة مكتب موثوق']
  }
];

export default function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [activeAudience, setActiveAudience] = useState<'client' | 'office'>('client');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [copiedIBAN, setCopiedIBAN] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Generate unique reference code for transfer
    const randomRef = 'MYZ-' + Math.floor(100000 + Math.random() * 900000);
    setReferenceCode(randomRef);
  }, []);

  const handleCopy = (text: string, type: 'iban' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'iban') {
      setCopiedIBAN(true);
      setTimeout(() => setCopiedIBAN(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/subscription-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: selectedPlan.id,
          amount: selectedPlan.price,
          referenceNumber: referenceCode,
          receiptImageUrl: receiptUrl,
          token
        })
      });

      const data = await response.json();
      if (data.success) {
        setSubmitSuccess(true);
      } else {
        alert(data.error || 'حدث خطأ أثناء إرسال الطلب.');
      }
    } catch {
      alert('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 dir-rtl font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/login" className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 mb-6">
            <ArrowRight className="w-4 h-4 ml-1" />
            العودة لتسجيل الدخول
          </Link>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            باقات مَيَّاز المميزة
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            اختر الباقة المناسبة لاحتياجك
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            احصل على أبحاث غير محدودة، تنبيهات فورية، ولوحة تحكم لإدارة وتسويق عقاراتك بكل سهولة.
          </p>

          {/* Legal VAT Notice */}
          <div className="mt-4 inline-block bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-400">
            ⚖️ <strong className="text-slate-300">تنويه قانوني:</strong> جميع الأسعار المعروضة أدناه <span className="text-emerald-400 font-semibold">شاملة ضريبة القيمة المضافة (15% VAT)</span>.
          </div>

          {/* Audience Switcher */}
          <div className="flex justify-center mt-8">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 inline-flex">
              <button
                onClick={() => { setActiveAudience('client'); setSelectedPlan(null); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeAudience === 'client'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                أفراد وباحثون عن عقار
              </button>
              <button
                onClick={() => { setActiveAudience('office'); setSelectedPlan(null); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeAudience === 'office'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                المكاتب والشركات العقارية
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        {!selectedPlan && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {(activeAudience === 'client' ? CLIENT_PLANS : OFFICE_PLANS).map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-slate-900 border rounded-2xl p-8 flex flex-col justify-between transition hover:border-emerald-500/50 ${
                  plan.isPopular
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                    : 'border-slate-800'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    الأكثر شعبية ⭐
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl font-extrabold text-emerald-400">{plan.price}</span>
                    <span className="text-slate-400 text-sm font-medium">ريال سعودي / {plan.duration}</span>
                  </div>

                  <ul className="space-y-3 mt-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-300 gap-2">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`mt-8 w-full py-3 px-4 rounded-xl font-semibold text-sm transition ${
                    plan.isPopular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  اختيار الباقة والمتابعة للدفع
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Confirmation Modal / View */}
        {selectedPlan && !submitSuccess && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">إتمام تفعيل: {selectedPlan.name}</h2>
                <p className="text-sm text-slate-400">المبلغ الإجمالي المطلوب: <strong className="text-emerald-400 text-base">{selectedPlan.price} ر.س</strong> (شامل الضريبة)</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                تغيير الباقة
              </button>
            </div>

            {/* Bank Details */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-2">
                <ShieldCheck className="w-5 h-5" />
                بيانات الحساب البنكي الرسمي (التحويل المباشر):
              </div>
              
              <div className="flex justify-between items-center text-sm border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">اسم البنك:</span>
                <span className="font-medium text-white">مصرف الراجحي (Al Rajhi Bank)</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">اسم المستفيد:</span>
                <span className="font-medium text-white">مؤسسة مَيَّاز لتقنية العقارات</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">رقم الآيبان (IBAN):</span>
                <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-emerald-400 bg-slate-900 px-2 py-1 rounded">
                  <span>SA0380000456608010123456</span>
                  <button onClick={() => handleCopy('SA0380000456608010123456', 'iban')} className="text-slate-400 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {copiedIBAN && <p className="text-xs text-emerald-400 text-left">تم نسخ رقم الآيبان ✅</p>}

              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-slate-400">الرقم المرجعي للحوالة:</span>
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-amber-400 bg-slate-900 px-2 py-1 rounded border border-amber-500/20">
                  <span>{referenceCode}</span>
                  <button onClick={() => handleCopy(referenceCode, 'ref')} className="text-slate-400 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {copiedRef && <p className="text-xs text-amber-400 text-left">تم نسخ الرقم المرجعي ✅</p>}
            </div>

            {/* Submission Form */}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  رابط أو إشعار التحويل البنكي (اختياري):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="رابط صورة الإشعار أو رقم المعاملة البنكية"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <Upload className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد إرسال الحوالة البنكية'}
                </button>

                <a
                  href={`https://wa.me/966530703441?text=${encodeURIComponent(`السلام عليكم، قمت بتحويل مبلغ ${selectedPlan.price} ريال للاشتراك في ${selectedPlan.name} بالرقم المرجعي ${referenceCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition flex items-center gap-2"
                >
                  💬 إرسال الإشعار عبر واتساب
                </a>
              </div>
            </form>
          </div>
        )}

        {/* Success State */}
        {submitSuccess && (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 max-w-xl mx-auto text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">تم استلام طلب اشتراكك بنجاح!</h2>
            <p className="text-slate-300 text-sm mb-4">
              الرقم المرجعي لطلبك هو: <strong className="text-emerald-400 font-mono text-base">{referenceCode}</strong>
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              سيقوم فريق مَيَّاز بالتحقق من الحوالة وتفعيل باقتك فوراً، وسيصلك إشعار فوري على تيليجرام.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition"
            >
              الذهاب لتسجيل الدخول
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
