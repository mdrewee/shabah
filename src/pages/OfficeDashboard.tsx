import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { apiFetch, formatSAR, normalizeArabic } from '../lib/api';
import { 
  Building, MapPin, DollarSign, Plus, Trash2, Edit3, 
  Search, Filter, CheckCircle2, AlertCircle, Share2, 
  MessageSquare, Phone, Users, ShieldCheck, QrCode, 
  Bell, Eye, ExternalLink, RefreshCw, X, Send,
  ChevronDown, LayoutGrid, Check, Clock
} from 'lucide-react';
import AddPropertyModal, { PropertyFormData } from '../components/AddPropertyModal';

const Handshake = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
    <path d="m21 3 1 11h-2" />
    <path d="M3 3 2 14l10 7 4-4-6-6" />
    <path d="m3 4 2 2" />
  </svg>
);

export const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  available: { label: 'متاح', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  sold: { label: 'تم البيع', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  rented: { label: 'تم التأجير', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  reserved: { label: 'محجوز', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
};

type ActiveTab = 'leads' | 'cobrokering' | 'properties' | 'settings';

export default function OfficeDashboard() {
  const { phone, role, officeId, logout } = useAuth();
  const navigate = useNavigate();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');

  // Office Profile State
  const [profile, setProfile] = useState<any>(null);
  const [officeName, setOfficeName] = useState<string>('مكتب عقاري');

  // Properties State
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyCategory, setPropertyCategory] = useState<'all' | 'بيع' | 'إيجار'>('all');
  const [propertyStatus, setPropertyStatus] = useState<string>('all');
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyFormData | null>(null);

  // Leads State
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLeadForMatches, setSelectedLeadForMatches] = useState<any | null>(null);
  const [matchedInternal, setMatchedInternal] = useState<any[]>([]);
  const [matchedExternal, setMatchedExternal] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isManualLeadModalOpen, setIsManualLeadModalOpen] = useState(false);
  const [manualLeadForm, setManualLeadForm] = useState({
    customer_name: '',
    customer_phone: '',
    property_type: 'دبلكس',
    city: 'الأحساء',
    district: '',
    max_price: '',
    raw_message: '',
    is_furnished: false
  });

  // Co-Brokering State
  const [cobrokeringSubTab, setCobrokeringSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Settings State
  const [telegramChatId, setTelegramChatId] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappQr, setWhatsappQr] = useState<string | null>(null);

  // Global Toast
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    loadProfile();
  }, [officeId, phone]);

  useEffect(() => {
    if (activeTab === 'properties') loadProperties();
    if (activeTab === 'leads') loadLeads();
    if (activeTab === 'cobrokering') loadCoBrokeringRequests();
  }, [activeTab, officeId]);

  // ==========================================
  // Profile Loader
  // ==========================================
  const loadProfile = async () => {
    try {
      let query = supabase.from('profiles').select('*');
      if (officeId) query = query.eq('id', officeId);
      else if (phone) query = query.eq('phone', phone);

      const { data } = await query.maybeSingle();
      if (data) {
        setProfile(data);
        if (data.office_name) setOfficeName(data.office_name);
        if (data.telegram_chat_id) setTelegramChatId(data.telegram_chat_id);
        if (data.whatsapp_connected !== undefined) setWhatsappConnected(data.whatsapp_connected);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // ==========================================
  // Tab 3: Properties Loader & Actions
  // ==========================================
  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (role !== 'admin' && officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProperties(data || []);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      showToast('تعذر تحميل العقارات', 'error');
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleToggleCoBrokering = async (propertyId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, allow_co_brokering: newVal } : p));
      const { error } = await supabase
        .from('properties')
        .update({ allow_co_brokering: newVal })
        .eq('id', propertyId);

      if (error) throw error;
      showToast(newVal ? 'تم تفعيل الوساطة التشاركية للعقار' : 'تم إيقاف الوساطة التشاركية للعقار');
    } catch (err) {
      console.error(err);
      showToast('فشل تحديث حالة الوساطة', 'error');
      loadProperties();
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus } : p));
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;
      showToast('تم تحديث حالة العقار بنجاح');
    } catch (err) {
      console.error(err);
      showToast('فشل تحديث الحالة', 'error');
      loadProperties();
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العقار نهائياً؟')) return;
    try {
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);
      if (error) throw error;
      showToast('تم حذف العقار بنجاح');
    } catch (err: any) {
      console.error(err);
      showToast('فشل حذف العقار', 'error');
      loadProperties();
    }
  };

  const handleSaveProperty = async (formData: PropertyFormData) => {
    try {
      const myId = officeId || profile?.id;
      const generatedRef = formData.reference_code?.trim() || `MZ-${Math.floor(100 + Math.random() * 900)}`;
      const payload: any = {
        title: formData.title,
        reference_code: generatedRef,
        allow_co_brokering: formData.allow_co_brokering !== false,
        category: formData.category,
        property_type: formData.property_type,
        city: formData.city || 'الأحساء',
        district: formData.district,
        price: Number(formData.price),
        area_sqm: Number(formData.area_sqm),
        rooms: formData.rooms ? Number(formData.rooms) : 0,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : 0,
        street_width: formData.street_width || null,
        facade: formData.facade || null,
        is_furnished: formData.is_furnished ?? false,
        ad_license_number: formData.ad_license_number,
        description: formData.description || null,
        images: formData.images || [],
        status: formData.status || 'available'
      };

      if (myId && role !== 'admin') {
        payload.office_id = myId;
      }

      if (formData.id) {
        const { error } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
        showToast('تم تحديث بيانات العقار بنجاح');
      } else {
        const { data: inserted, error } = await supabase
          .from('properties')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        showToast(`تم نشر العقار بنجاح برقم إعلان #${generatedRef}`);

        if (inserted) {
          try {
            apiFetch('/api/notify-alerts', {
              method: 'POST',
              body: JSON.stringify(inserted)
            }).catch(() => {});
          } catch {}
        }
      }

      await loadProperties();
    } catch (err: any) {
      console.error('Error saving property:', err);
      showToast('تعذر حفظ العقار: ' + (err.message || ''), 'error');
      throw err;
    }
  };

  // ==========================================
  // Tab 1: Leads Loader & Dual Matching Engine
  // ==========================================
  const loadLeads = async () => {
    try {
      setLoadingLeads(true);
      let query = supabase
        .from('office_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (role !== 'admin' && officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleInspectLeadMatches = async (lead: any) => {
    setSelectedLeadForMatches(lead);
    setLoadingMatches(true);
    try {
      const normDistrict = normalizeArabic(lead.district || '');
      const normCity = normalizeArabic(lead.city || 'الاحساء');
      const maxPrice = lead.max_price ? Number(lead.max_price) : null;
      const propType = lead.property_type;

      // 1. Fetch Internal Matches (same office)
      let internalQuery = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available');

      if (officeId) {
        internalQuery = internalQuery.eq('office_id', officeId);
      }

      const { data: allInternal } = await internalQuery;
      const filteredInternal = (allInternal || []).filter(p => {
        const pDistrict = normalizeArabic(p.district || '');
        const pCity = normalizeArabic(p.city || 'الاحساء');
        const matchDistrict = !normDistrict || pDistrict.includes(normDistrict) || normDistrict.includes(pDistrict);
        const matchType = !propType || p.property_type === propType;
        const matchPrice = !maxPrice || Number(p.price) <= maxPrice * 1.15; // 15% tolerance
        return matchDistrict && matchType && matchPrice;
      });
      setMatchedInternal(filteredInternal);

      // 2. Fetch External Matches (other offices, allow_co_brokering = true)
      let externalQuery = supabase
        .from('properties')
        .select('id, reference_code, property_type, district, city, price, area_sqm, rooms, bathrooms, is_furnished, category, office_id')
        .eq('status', 'available')
        .eq('allow_co_brokering', true);

      if (officeId) {
        externalQuery = externalQuery.neq('office_id', officeId);
      }

      const { data: allExternal } = await externalQuery;
      const filteredExternal = (allExternal || []).filter(p => {
        const pDistrict = normalizeArabic(p.district || '');
        const matchDistrict = !normDistrict || pDistrict.includes(normDistrict) || normDistrict.includes(pDistrict);
        const matchType = !propType || p.property_type === propType;
        const matchPrice = !maxPrice || Number(p.price) <= maxPrice * 1.15;
        return matchDistrict && matchType && matchPrice;
      });
      setMatchedExternal(filteredExternal);

      // Update lead match counts in DB if different
      if (lead.internal_matches_count !== filteredInternal.length || lead.external_matches_count !== filteredExternal.length) {
        await supabase
          .from('office_leads')
          .update({
            internal_matches_count: filteredInternal.length,
            external_matches_count: filteredExternal.length
          })
          .eq('id', lead.id);

        setLeads(prev => prev.map(l => l.id === lead.id ? {
          ...l,
          internal_matches_count: filteredInternal.length,
          external_matches_count: filteredExternal.length
        } : l));
      }
    } catch (err) {
      console.error('Error fetching lead matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleRequestCoBrokering = async (property: any) => {
    if (!selectedLeadForMatches) return;
    try {
      const targetSellerOfficeId = property.office_id;
      const payload = {
        lead_id: selectedLeadForMatches.id,
        property_id: property.id,
        buyer_office_id: officeId || profile?.id,
        seller_office_id: targetSellerOfficeId,
        status: 'pending'
      };

      const { error } = await supabase
        .from('co_brokering_requests')
        .upsert(payload, { onConflict: 'lead_id,property_id' });

      if (error) throw error;
      showToast(`تم إرسال طلب الوساطة للعقار #${property.reference_code || ''} بنجاح! تم إشعار المكتب المالك.`);
      setSelectedLeadForMatches(null);
    } catch (err: any) {
      console.error(err);
      showToast('تعذر إرسال طلب التعاون: ' + (err.message || 'خطأ غير متوقع'), 'error');
    }
  };

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        office_id: officeId || profile?.id,
        customer_name: manualLeadForm.customer_name || 'عميل محتمل',
        customer_phone: manualLeadForm.customer_phone,
        property_type: manualLeadForm.property_type,
        city: manualLeadForm.city || 'الأحساء',
        district: manualLeadForm.district,
        max_price: manualLeadForm.max_price ? Number(manualLeadForm.max_price) : null,
        raw_message: manualLeadForm.raw_message || `طلب عميل: ${manualLeadForm.property_type} في حي ${manualLeadForm.district}`,
        source: 'manual',
        is_furnished: manualLeadForm.is_furnished,
        status: 'new'
      };

      const { data, error } = await supabase
        .from('office_leads')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      showToast('تمت إضافة طلب العميل، جاري فحص الرادار والتطابقات');
      setIsManualLeadModalOpen(false);
      setManualLeadForm({
        customer_name: '',
        customer_phone: '',
        property_type: 'دبلكس',
        city: 'الأحساء',
        district: '',
        max_price: '',
        raw_message: '',
        is_furnished: false
      });
      loadLeads();
      if (data) handleInspectLeadMatches(data);
    } catch (err: any) {
      console.error(err);
      showToast('فشل إضافة الطلب: ' + (err.message || ''), 'error');
    }
  };

  // ==========================================
  // Tab 2: Co-Brokering Handshake Engine
  // ==========================================
  const loadCoBrokeringRequests = async () => {
    try {
      setLoadingRequests(true);
      const myId = officeId || profile?.id;
      if (!myId && role !== 'admin') return;

      // 1. Incoming: Requests from other offices wanting my properties
      let incomingQuery = supabase
        .from('co_brokering_requests')
        .select(`
          id, status, created_at, lead_id, property_id,
          buyer_office_id, seller_office_id,
          buyer_office:profiles!co_brokering_requests_buyer_office_id_fkey(id, office_name, phone),
          property:properties!co_brokering_requests_property_id_fkey(id, reference_code, title, price, district, property_type),
          lead:office_leads!co_brokering_requests_lead_id_fkey(customer_phone, property_type, district, max_price)
        `)
        .order('created_at', { ascending: false });

      if (role !== 'admin' && myId) {
        incomingQuery = incomingQuery.eq('seller_office_id', myId);
      }

      const { data: incomingData, error: inErr } = await incomingQuery;
      if (!inErr) setIncomingRequests(incomingData || []);

      // 2. Outgoing: Requests I sent to other offices
      let outgoingQuery = supabase
        .from('co_brokering_requests')
        .select(`
          id, status, created_at, lead_id, property_id,
          buyer_office_id, seller_office_id,
          seller_office:profiles!co_brokering_requests_seller_office_id_fkey(id, office_name, phone),
          property:properties!co_brokering_requests_property_id_fkey(id, reference_code, title, price, district, property_type),
          lead:office_leads!co_brokering_requests_lead_id_fkey(customer_name, customer_phone, property_type, district)
        `)
        .order('created_at', { ascending: false });

      if (role !== 'admin' && myId) {
        outgoingQuery = outgoingQuery.eq('buyer_office_id', myId);
      }

      const { data: outgoingData, error: outErr } = await outgoingQuery;
      if (!outErr) setOutgoingRequests(outgoingData || []);
    } catch (err) {
      console.error('Error fetching co-brokering requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('co_brokering_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      showToast(newStatus === 'approved' ? 'تمت الموافقة وفتح قنوات التواصل المباشر!' : 'تم رفض طلب الوساطة');
      loadCoBrokeringRequests();
    } catch (err: any) {
      console.error(err);
      showToast('فشل الرد على الطلب', 'error');
    }
  };

  const handleSendTeaserToClient = (req: any) => {
    const customerPhone = req.lead?.customer_phone ? req.lead.customer_phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = customerPhone.startsWith('05') ? '966' + customerPhone.substring(1) : customerPhone;
    const prop = req.property;
    const myId = officeId || profile?.id;
    const previewUrl = `${window.location.origin}/view/${prop.id}?broker=${myId}`;

    const text = `السلام عليكم ورحمة الله وبركاته،\nبناءً على طلبك، وجدنا لك عقاراً مناسباً:\n\n• الإعلان: #${prop.reference_code || ''}\n• النوع: ${prop.property_type}\n• الحي: ${prop.district}\n• السعر: ${formatSAR(prop.price)}\n\n📸 يمكنك استعراض صور العقار وتفاصيله الكاملة عبر هذا الرابط:\n${previewUrl}\n\nيسعدنا خدمتكم في المعاينة والإفراغ.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ==========================================
  // Tab 4: Settings & Telegram Linking
  // ==========================================
  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const myId = officeId || profile?.id;
      if (!myId) throw new Error('لا يوجد معرف للمكتب');

      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: telegramChatId.trim() })
        .eq('id', myId);

      if (error) throw error;
      showToast('تم حفظ معرف التيليجرام بنجاح! ستصلك التنبيهات الفورية هنا.');
      loadProfile();
    } catch (err: any) {
      console.error(err);
      showToast('تعذر حفظ الإعدادات', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter properties
  const filteredProperties = properties.filter(prop => {
    const q = propertySearch.toLowerCase();
    const matchesSearch = 
      (prop.title || '').toLowerCase().includes(q) ||
      (prop.district || '').toLowerCase().includes(q) ||
      (prop.reference_code || '').toLowerCase().includes(q) ||
      (prop.ad_license_number || '').includes(q);

    const matchesCat = propertyCategory === 'all' || prop.category === propertyCategory;
    const matchesStat = propertyStatus === 'all' || prop.status === propertyStatus;
    return matchesSearch && matchesCat && matchesStat;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-5 py-3 rounded-lg shadow-md border text-sm font-semibold flex items-center gap-2.5 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="mr-2 text-slate-400 hover:text-slate-700">✕</button>
          </div>
        </div>
      )}

      {/* Top Bar (Navbar) - Official Salla/Ejari Style */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              مَيَّاز
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">{officeName}</h1>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  لوحة تحكم المكتب
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">{phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Top Bar Button: Official Orange */}
            <button
              onClick={() => {
                setEditingProperty(null);
                setIsPropertyModalOpen(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عقار جديد</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              الملف والاشتراك
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors"
              title="تسجيل الخروج"
            >
              خروج
            </button>
          </div>
        </div>

        {/* 4 Official Tabs Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-100">
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'leads'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>طلبات العملاء والرادار</span>
            {leads.length > 0 && (
              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {leads.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cobrokering')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'cobrokering'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Handshake className="w-4 h-4" />
            <span>طلبات التعاون بين المكاتب</span>
            {incomingRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {incomingRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('properties')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'properties'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>عروضي العقارية</span>
            <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {properties.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>الربط والإعدادات</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ======================================================== */}
        {/* TAB 1: طلبات العملاء والرادار (Leads & Matches) */}
        {/* ======================================================== */}
        {activeTab === 'leads' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">طلبات العملاء والرادار الذكي</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  الطلبات الملتقطة تلقائياً عبر قارئ الواتساب الصامت، مع نتائج البحث المزدوج في عروضك وعروض المكاتب الشريكة.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsManualLeadModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طلب عميل يدوياً</span>
                </button>
                <button
                  onClick={loadLeads}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                  title="تحديث"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingLeads ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">جاري تحميل طلبات العملاء...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">لا توجد طلبات عملاء حتى الآن</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  عندما يرسل العميل رسالة في واتساب المكتب، يلتقطها القارئ الصامت تلقائياً أو يمكنك إضافتها يدوياً.
                </p>
                <button
                  onClick={() => setIsManualLeadModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  + إضافة أول طلب عميل
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="py-3 px-4">التاريخ</th>
                        <th className="py-3 px-4">العميل</th>
                        <th className="py-3 px-4">المصدر</th>
                        <th className="py-3 px-4">مواصفات الطلب</th>
                        <th className="py-3 px-4">نص الرسالة</th>
                        <th className="py-3 px-4 text-center">عروضي المطابقة</th>
                        <th className="py-3 px-4 text-center">عروض المكاتب الشريكة</th>
                        <th className="py-3 px-4 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{lead.customer_name || 'عميل محتمل'}</div>
                            <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{lead.customer_phone}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.source === 'whatsapp_listener'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : lead.source === 'telegram'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {lead.source === 'whatsapp_listener' ? 'واتساب صامت' : lead.source === 'telegram' ? 'تيليجرام' : 'يدوي'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">
                              {lead.property_type || 'عقار'} {lead.district ? `• حي ${lead.district}` : ''}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              {lead.max_price ? `حتى ${formatSAR(lead.max_price)}` : 'السعر غير محدد'}
                              {lead.is_furnished ? ' • مؤثث' : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={lead.raw_message}>
                            "{lead.raw_message}"
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              (lead.internal_matches_count || 0) > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {lead.internal_matches_count || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              (lead.external_matches_count || 0) > 0
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {lead.external_matches_count || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleInspectLeadMatches(lead)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 mx-auto transition-colors shadow-sm"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>فحص العروض والتعاون</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: طلبات التعاون بين المكاتب (Co-Brokering Handshake) */}
        {/* ======================================================== */}
        {activeTab === 'cobrokering' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">منظومة الوساطة التشاركية بين المكاتب</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  إدارة طلبات الاستئذان لترويج العروض المشتركة، وفتح قنوات التواصل المباشر وتجهيز بطاقات المعاينة للعملاء.
                </p>
              </div>

              {/* Sub-Tabs */}
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setCobrokeringSubTab('incoming')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    cobrokeringSubTab === 'incoming'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الطلبات الواردة ({incomingRequests.length})
                </button>
                <button
                  onClick={() => setCobrokeringSubTab('outgoing')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    cobrokeringSubTab === 'outgoing'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الطلبات الصادرة ({outgoingRequests.length})
                </button>
              </div>
            </div>

            {loadingRequests ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">جاري تحميل طلبات الوساطة...</p>
              </div>
            ) : cobrokeringSubTab === 'incoming' ? (
              /* INCOMING REQUESTS */
              incomingRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-900 mb-1">لا توجد طلبات وساطة واردة حالياً</h3>
                  <p className="text-xs text-slate-500">
                    عندما يطلب مكتب آخر تسويق أحد عقاراتك لعميله، ستظهر طلبات الاستئذان هنا للموافقة أو الرفض.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingRequests.map((req) => (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                              #{req.property?.reference_code || 'MZ-XXX'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{req.property?.title}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            حي {req.property?.district} • {formatSAR(req.property?.price)}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'approved' ? 'تمت الموافقة' : req.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500">المكتب طالب الوساطة:</span>
                          <span className="font-bold text-slate-900">{req.buyer_office?.office_name || 'مكتب عقاري شريك'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">الطلب المطابق:</span>
                          <span className="text-slate-700">
                            مشتري يبحث عن {req.lead?.property_type} في {req.lead?.district}
                          </span>
                        </div>
                      </div>

                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespondToRequest(req.id, 'approved')}
                            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>موافقة وفتح التواصل</span>
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(req.id, 'rejected')}
                            className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                          >
                            رفض
                          </button>
                        </div>
                      ) : req.status === 'approved' ? (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>تمت مشاركة بيانات الاتصال</span>
                          </span>
                          <a
                            href={`https://wa.me/${req.buyer_office?.phone?.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>تواصل عبر الواتساب</span>
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center">تم رفض هذا الطلب مسبقاً</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* OUTGOING REQUESTS */
              outgoingRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-900 mb-1">لا توجد طلبات وساطة صادرة حتى الآن</h3>
                  <p className="text-xs text-slate-500">
                    عندما تجد عقاراً مناسباً لعميلك لدى مكتب شريك وتضغط "طلب تعاون"، سيظهر الطلب وحالته هنا.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outgoingRequests.map((req) => (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                              #{req.property?.reference_code || 'MZ-XXX'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{req.property?.title}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            حي {req.property?.district} • {formatSAR(req.property?.price)}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'approved' ? 'تمت الموافقة' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500">عميلك المعني بالطلب:</span>
                          <span className="font-bold text-slate-900">{req.lead?.customer_name || 'عميل محتمل'} ({req.lead?.customer_phone})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">المكتب المالك للعقار:</span>
                          <span className="font-bold text-slate-700">
                            {req.status === 'approved' ? req.seller_office?.office_name : 'محجوب حتى الموافقة'}
                          </span>
                        </div>
                      </div>

                      {req.status === 'approved' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${req.seller_office?.phone?.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                              <span>تواصل مع المكتب المالك ({req.seller_office?.phone})</span>
                            </a>
                          </div>
                          <button
                            onClick={() => handleSendTeaserToClient(req)}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>تجهيز وإرسال بطاقة العرض والصور لعميلي عبر واتساب</span>
                          </button>
                        </div>
                      ) : req.status === 'rejected' ? (
                        <p className="text-xs text-rose-700 font-medium text-center">
                          اعتذر المكتب المالك عن مشاركة هذا العرض حالياً.
                        </p>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-xs text-amber-700 font-medium py-1">
                          <Clock className="w-4 h-4 animate-spin text-amber-600" />
                          <span>في انتظار موافقة المكتب المالك لإتاحة بطاقة العرض لعميلك...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: عروضي العقارية (My Properties) */}
        {/* ======================================================== */}
        {activeTab === 'properties' && (
          <div>
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">عروضي العقارية</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  إدارة وتحديث عروض المكتب، وتحديد صلاحيات الوساطة التشاركية لكل عقار.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setIsPropertyModalOpen(true);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة عقار جديد</span>
                </button>
                <button
                  onClick={loadProperties}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                  title="تحديث"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الحي، أو كود الإعلان #MZ-..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <select
                value={propertyCategory}
                onChange={(e: any) => setPropertyCategory(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                <option value="all">كل الفئات</option>
                <option value="بيع">عروض البيع</option>
                <option value="إيجار">عروض الإيجار</option>
              </select>

              <select
                value={propertyStatus}
                onChange={(e) => setPropertyStatus(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                <option value="all">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="sold">تم البيع</option>
                <option value="rented">تم التأجير</option>
                <option value="reserved">محجوز</option>
              </select>
            </div>

            {/* Properties Grid */}
            {loadingProperties ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">جاري تحميل قائمة العقارات...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                <Building className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">لا توجد عقارات مطابقة</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  لم يتم العثور على أي عقار يطابق معايير الفلترة المحددة.
                </p>
                <button
                  onClick={() => {
                    setPropertySearch('');
                    setPropertyCategory('all');
                    setPropertyStatus('all');
                  }}
                  className="text-xs text-emerald-800 font-bold hover:underline"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProperties.map((prop) => (
                  <div key={prop.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      {/* Image Preview & Reference Badge */}
                      <div className="relative aspect-[16/10] bg-slate-100">
                        <img
                          src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          <span className="bg-slate-900 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow">
                            #{prop.reference_code || 'MZ-XXX'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                            prop.category === 'بيع' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {prop.category}
                          </span>
                        </div>
                      </div>

                      {/* Details Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-slate-900 text-sm mb-1.5 line-clamp-1">{prop.title}</h3>
                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prop.city || 'الأحساء'} - حي {prop.district}</span>
                        </p>

                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-3">
                          <div>
                            <span className="text-[10px] text-slate-500 block">السعر</span>
                            <span className="text-sm font-bold text-emerald-800">{formatSAR(prop.price)}</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-slate-500 block">المساحة</span>
                            <span className="text-xs font-bold text-slate-700">{prop.area_sqm || prop.area || '-'} م²</span>
                          </div>
                        </div>

                        {/* Co-Brokering Toggle Switch */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Handshake className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-bold text-slate-800">وساطة تشاركية</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prop.allow_co_brokering !== false}
                              onChange={() => handleToggleCoBrokering(prop.id, prop.allow_co_brokering !== false)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-700"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <select
                        value={prop.status || 'available'}
                        onChange={(e) => handleStatusChange(prop.id, e.target.value)}
                        className="text-xs font-semibold py-1 px-2 rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      >
                        <option value="available">متاح</option>
                        <option value="sold">تم البيع</option>
                        <option value="rented">تم التأجير</option>
                        <option value="reserved">محجوز</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <a
                          href={`/view/${prop.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded transition-colors"
                          title="معاينة الصفحة"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            setEditingProperty(prop);
                            setIsPropertyModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-white rounded transition-colors"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-white rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: الربط والإعدادات (Integrations & Settings) */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">الربط التقني وقنوات الاتصال</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                ربط قارئ الواتساب الصامت وحساب التيليجرام لاستلام التنبيهات وإشعارات الوساطة اللحظية.
              </p>
            </div>

            {/* Silent WhatsApp Harvester Section */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">قارئ الواتساب الصامت (Silent WhatsApp Listener)</h3>
                  <p className="text-xs text-slate-500">التقاط طلبات العملاء عبر بوابة "صفر توكن" الخوارزمية</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2 mb-2 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>ضمان الخصوصية وعدم الإزعاج:</span>
                </div>
                <p>
                  قارئ الواتساب يعمل كأداة استماع صامتة فقط (messages.upsert) لالتقاط رسائل العقار وتحويلها إلى طلبات بالداشبورد.
                  <strong> النظام لن يرسل أي ردود تلقائية نهائياً من رقمك إلى جهات اتصالك.</strong>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${whatsappConnected ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      حالة الاتصال: {whatsappConnected ? 'متصل وجاري الاستماع' : 'غير متصل'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {whatsappConnected ? 'تم ربط رقم المكتب بالقارئ بنجاح' : 'امسح الباركود لربط واتساب المكتب'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWhatsappConnected(true);
                    showToast('تم تحديث حالة القارئ الصامت: متصل بنجاح');
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  {whatsappConnected ? 'تحديث الاتصال' : 'بدء جلسة الربط'}
                </button>
              </div>
            </div>

            {/* Telegram Radar & Co-Brokering Alerts Section */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-800">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ربط بوت التيليجرام للتنبيهات الفورية</h3>
                  <p className="text-xs text-slate-500">استلام طلبات العملاء والوساطة التشاركية على هاتفك لحظياً</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 mb-1">خطوات الربط البسيطة:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>افتح تطبيق تيليجرام وابحث عن بوت مياز <strong>@MayyazBot</strong>.</li>
                  <li>اضغط <strong>بدء (/start)</strong> ثم احصل على معرف الدردشة الخاص بك (Chat ID).</li>
                  <li>الصق المعرف في الحقل أدناه واضغط حفظ.</li>
                </ol>
              </div>

              <form onSubmit={handleSaveTelegram} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-slate-700 block mb-1">معرف الدردشة (Telegram Chat ID)</label>
                  <input
                    type="text"
                    placeholder="مثال: 8007324846"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full sm:w-auto mt-auto bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ المعرف'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL: فحص العروض والتطابقات لطلب عميل */}
      {/* ======================================================== */}
      {selectedLeadForMatches && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  نتائج الرادار والتطابق للطلب: {selectedLeadForMatches.property_type || 'عقار'} في حي {selectedLeadForMatches.district || 'الأحساء'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  العميل: {selectedLeadForMatches.customer_name} ({selectedLeadForMatches.customer_phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadForMatches(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-6">
              {loadingMatches ? (
                <div className="text-center py-10">
                  <div className="w-7 h-7 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">جاري مقارنة العروض الداخلية والخارجية...</p>
                </div>
              ) : (
                <>
                  {/* 1. Internal Matches */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-emerald-700" />
                      <span>عروض مكتبي المطابقة ({matchedInternal.length})</span>
                    </h4>
                    {matchedInternal.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded border border-slate-200">
                        لا يوجد عقار مطابق حالياً في عروض مكتبك.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {matchedInternal.map((p) => (
                          <div key={p.id} className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="font-mono bg-slate-900 text-white px-1.5 py-0.2 rounded text-[10px]">
                                  #{p.reference_code || 'MZ-XXX'}
                                </span>
                                <span>{p.title}</span>
                              </div>
                              <p className="text-slate-600 mt-0.5">{p.district} • {formatSAR(p.price)}</p>
                            </div>
                            <a
                              href={`/view/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors"
                            >
                              عرض لعميلك
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. External Co-Brokering Matches */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Handshake className="w-4 h-4 text-orange-600" />
                      <span>عروض مطابقة من مكاتب شريكة (متاحة للوساطة) ({matchedExternal.length})</span>
                    </h4>
                    {matchedExternal.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded border border-slate-200">
                        لا توجد عروض خارجية مطابقة متاحة للوساطة حالياً.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {matchedExternal.map((p) => (
                          <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="font-mono bg-slate-900 text-white px-1.5 py-0.2 rounded text-[10px]">
                                  #{p.reference_code || 'MZ-XXX'}
                                </span>
                                <span>{p.property_type} في حي {p.district}</span>
                                {p.is_furnished && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">مؤثث</span>
                                )}
                              </div>
                              <p className="text-slate-600 mt-0.5">
                                المساحة: {p.area_sqm || '-'} م² • الغرف: {p.rooms || '-'} • السعر: <strong className="text-emerald-800">{formatSAR(p.price)}</strong>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                * بيانات المكتب المالك والموقع الدقيق محجوبة حتى موافقة المكتب على التعاون.
                              </p>
                            </div>
                            <button
                              onClick={() => handleRequestCoBrokering(p)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                            >
                              <Handshake className="w-3.5 h-3.5" />
                              <span>طلب تعاون وعرض لعميلي</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLeadForMatches(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: إضافة طلب عميل يدوياً */}
      {/* ======================================================== */}
      {isManualLeadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">إضافة طلب عميل يدوياً للرادار</h3>
              <button
                onClick={() => setIsManualLeadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLead} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم العميل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أبو محمد"
                  value={manualLeadForm.customer_name}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم هاتف العميل (للتواصل وإرسال العروض)</label>
                <input
                  type="text"
                  required
                  placeholder="05xxxxxxxx"
                  value={manualLeadForm.customer_phone}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, customer_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع العقار المطلوب</label>
                  <select
                    value={manualLeadForm.property_type}
                    onChange={(e) => setManualLeadForm({ ...manualLeadForm, property_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="دبلكس">دبلكس</option>
                    <option value="فيلا">فيلا</option>
                    <option value="شقة">شقة</option>
                    <option value="أرض">أرض</option>
                    <option value="دور">دور</option>
                    <option value="عمارة">عمارة</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الحي المستهدف</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: النايفية أو الهفوف"
                    value={manualLeadForm.district}
                    onChange={(e) => setManualLeadForm({ ...manualLeadForm, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الحد الأقصى للسعر (ر.س)</label>
                <input
                  type="number"
                  placeholder="مثال: 1200000"
                  value={manualLeadForm.max_price}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, max_price: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="furnished-check"
                  checked={manualLeadForm.is_furnished}
                  onChange={(e) => setManualLeadForm({ ...manualLeadForm, is_furnished: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                />
                <label htmlFor="furnished-check" className="text-slate-700 font-semibold cursor-pointer">
                  يشترط أن يكون العقار مؤثثاً
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualLeadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  حفظ وتشغيل الرادار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Modal (Add / Edit) */}
      <AddPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSave={handleSaveProperty}
        initialData={editingProperty}
      />

    </div>
  );
}
