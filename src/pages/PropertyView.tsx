import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatSAR } from '../lib/api';
import { 
  Building, MapPin, DollarSign, Home, CheckCircle2, 
  Share2, ArrowRight, ShieldCheck, Phone, MessageSquare, 
  Layers, Compass, Maximize2, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function PropertyView() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [searchParams] = useSearchParams();
  const brokerId = searchParams.get('broker');
  const navigate = useNavigate();

  const [property, setProperty] = useState<any>(null);
  const [broker, setBroker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!propertyId) return;
    loadPropertyData();
  }, [propertyId, brokerId]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Property
      const { data: propData, error: propErr } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .maybeSingle();

      if (propErr) throw propErr;
      if (!propData) {
        setError('العقار غير موجود أو تم إلغاء نشره');
        return;
      }
      setProperty(propData);

      // 2. Fetch Broker profile (if specified in query param) or fallback to property's office
      const targetOfficeId = brokerId || propData.office_id;
      if (targetOfficeId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, office_name, phone, role')
          .eq('id', targetOfficeId)
          .maybeSingle();

        if (profileData) {
          setBroker(profileData);
        } else {
          // Fallback to offices table if not yet in profiles
          const { data: officeData } = await supabase
            .from('offices')
            .select('id, name, phone')
            .eq('id', targetOfficeId)
            .maybeSingle();
          if (officeData) {
            setBroker({
              id: officeData.id,
              office_name: officeData.name,
              phone: officeData.phone
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading property view:', err);
      setError('حدث خطأ أثناء تحميل بيانات العقار');
    } finally {
      setLoading(false);
    }
  };

  const images: string[] = property?.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || 'عقار مميز في مياز',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط العقار إلى الحافظة');
    }
  };

  const handleContactWhatsApp = () => {
    const phone = broker?.phone ? broker.phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('05') ? '966' + phone.substring(1) : phone;
    const ref = property?.reference_code ? ` (إعلان: #${property.reference_code})` : '';
    const msg = encodeURIComponent(`السلام عليكم، بخصوص العقار المعروض: ${property?.title || ''}${ref}\nأرغب في الاستفسار وتنسيق موعد للمعاينة.`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-medium">جاري تحميل بيانات العقار...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">تعذر العثور على العقار</h2>
          <p className="text-slate-600 text-sm mb-6">{error || 'العقار غير متاح حالياً'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">منصة مَيَّاز</span>
                {property.reference_code && (
                  <span className="bg-slate-900 text-white font-mono text-xs px-2 py-0.5 rounded font-bold">
                    #{property.reference_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">بطاقة العرض الذكية المعتمدة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="مشاركة الرابط"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {broker && (
              <button
                onClick={handleContactWhatsApp}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>تواصل مع الوسيط</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Broker Attribution Header Banner */}
        {broker && (
          <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700 font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">عرض معتمد ومقدم بواسطة الوسيط المباشر:</p>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{broker.office_name || 'مكتب عقاري معتمد'}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleContactWhatsApp}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{broker.phone}</span>
              </button>
            </div>
          </div>
        )}

        {/* Gallery Section */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-6">
          <div className="relative aspect-video sm:aspect-[16/9] max-h-[480px] bg-slate-900">
            <img
              src={images[activeImageIndex]}
              alt={property.title}
              className="w-full h-full object-contain sm:object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-mono">
                  {activeImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 p-3 overflow-x-auto border-t border-slate-200 bg-slate-50">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition-all ${
                    idx === activeImageIndex ? 'border-emerald-700 ring-2 ring-emerald-700/20' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title & Key Info */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  property.category === 'بيع' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {property.category === 'بيع' ? 'للبيع' : 'للإيجار'}
                </span>
                <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded">
                  {property.property_type}
                </span>
                {property.is_furnished && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded">
                    مؤثث بالكامل
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{property.city || 'الأحساء'} - حي {property.district}</span>
              </div>
            </div>

            <div className="text-right sm:text-left bg-slate-50 p-4 rounded-lg border border-slate-200 sm:min-w-[200px]">
              <p className="text-xs text-slate-500 mb-1">السعر المطلوب</p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-800">
                {formatSAR(property.price)}
              </p>
              {property.category === 'بيع' && property.price && (
                <p className="text-xs text-slate-500 mt-1">
                  قسط تقريبي: {formatSAR(Math.round(property.price / 240))} / شهر
                </p>
              )}
            </div>
          </div>

          {/* Core Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-xs text-slate-500 block mb-1">المساحة</span>
              <span className="text-base font-bold text-slate-900">{property.area_sqm || property.area || '-'} م²</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-xs text-slate-500 block mb-1">الغرف</span>
              <span className="text-base font-bold text-slate-900">{property.rooms || 0} غرف</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-xs text-slate-500 block mb-1">دورات المياه</span>
              <span className="text-base font-bold text-slate-900">{property.bathrooms || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-xs text-slate-500 block mb-1">عرض الشارع</span>
              <span className="text-base font-bold text-slate-900">{property.street_width || '-'} م</span>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2">الوصف والتفاصيل:</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
                {property.description}
              </p>
            </div>
          )}

          {/* Compliance & Verification Badges */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>مرخص ومعتمد في منصة مياز</span>
            </div>
            {property.ad_license_number && (
              <span className="text-slate-500 font-mono">رخصة الإعلان: {property.ad_license_number}</span>
            )}
            {property.facade && (
              <span className="text-slate-500">الواجهة: {property.facade}</span>
            )}
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-emerald-900 text-white rounded-lg p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-1">هل أنت مهتم بمعاينة هذا العقار؟</h3>
            <p className="text-emerald-200 text-xs sm:text-sm">
              تواصل مباشرة مع الوسيط المعتمد للحصول على كافة التفاصيل وتنسيق موعد للمعاينة الميدانية.
            </p>
          </div>
          <button
            onClick={handleContactWhatsApp}
            className="w-full sm:w-auto bg-white text-emerald-900 hover:bg-emerald-50 px-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>طلب معاينة عبر الواتساب</span>
          </button>
        </div>

      </main>
    </div>
  );
}
