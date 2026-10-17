import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, getAuthToken } from '../lib/supabaseClient';
import { 
  LogOut, Plus, Trash2, Edit3, Building, MapPin, DollarSign, 
  Clock, ShieldCheck, Search, Filter, Home, CheckCircle2, 
  ExternalLink, Sparkles, AlertTriangle, User, Droplets,
  LayoutGrid, Map as MapIcon
} from 'lucide-react';
import AddPropertyModal, { PropertyFormData } from '../components/AddPropertyModal';
import MapComponent from '../components/MapComponent';

export const STATUS_CONFIG = {
  available: { label: 'متاح', color: 'bg-emerald-500 text-white', dot: 'bg-emerald-500', border: 'border-emerald-200 bg-emerald-50/50 text-emerald-800' },
  sold: { label: 'تم البيع', color: 'bg-rose-500 text-white', dot: 'bg-rose-500', border: 'border-rose-200 bg-rose-50/50 text-rose-800' },
  rented: { label: 'تم التأجير', color: 'bg-blue-500 text-white', dot: 'bg-blue-500', border: 'border-blue-200 bg-blue-50/50 text-blue-800' },
  reserved: { label: 'محجوز', color: 'bg-amber-500 text-white', dot: 'bg-amber-500', border: 'border-amber-200 bg-amber-50/50 text-amber-800' },
};

interface Props {
  hideHeader?: boolean;
}

export default function OfficeDashboard({ hideHeader = false }: Props) {
  const { phone, role, officeId, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState<any[]>([]);
  const [officeName, setOfficeName] = useState<string>('مكتب عقاري');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'بيع' | 'إيجار'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Modal & Toast state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyFormData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchOfficeInfo();
    fetchProperties();
  }, [role, officeId]);

  const fetchOfficeInfo = async () => {
    if (!officeId && !phone) return;
    try {
      let query = supabase.from('offices').select('name');
      if (officeId) query = query.eq('id', officeId);
      else if (phone) query = query.eq('phone', phone);
      
      const { data } = await query.maybeSingle();
      if (data?.name) setOfficeName(data.name);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');

      const activeToken = await getAuthToken(token);
      if (activeToken) {
        try {
          const res = await fetch('http://localhost:5000/api/properties/my-properties', {
            headers: { 'Authorization': `Bearer ${activeToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.ok && Array.isArray(data.properties)) {
              setProperties(data.properties);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('Backend properties fetch failed, falling back to direct query:', apiErr);
        }
      }

      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (role !== 'admin' && officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      setProperties(data || []);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError('فشل في جلب قائمة العقارات');
    } finally {
      setLoading(false);
    }
  };

  const formatNearbyPlaces = (places: any): string => {
    if (!places) return '';
    if (typeof places === 'string') return places;
    if (typeof places === 'object') {
      if (places.raw && typeof places.raw === 'string') return places.raw;
      const parts: string[] = [];
      if (Array.isArray(places.walkable)) {
        for (const p of places.walkable) {
          if (p?.name) parts.push(`${p.name} (${p.distance_m ? p.distance_m + 'م' : 'مشي'})`);
        }
      }
      if (Array.isArray(places.driving)) {
        for (const p of places.driving) {
          if (p?.name) parts.push(`${p.name} (${p.distance_km ? p.distance_km + 'كم' : 'بالسيارة'})`);
        }
      }
      return parts.join(' • ');
    }
    return '';
  };

  const handleSaveProperty = async (formData: PropertyFormData) => {
    try {
      const payload: any = {
        title: formData.title,
        category: formData.category,
        property_type: formData.property_type,
        city: formData.city,
        district: formData.district,
        project_name: formData.project_name || null,
        parent_building_id: formData.parent_building_id || null,
        length: formData.length === '' ? null : Number(formData.length),
        width: formData.width === '' ? null : Number(formData.width),
        area_sqm: Number(formData.area_sqm),
        street_width: formData.street_width || null,
        street_width_m: formData.street_width ? Number(String(formData.street_width).replace(/[^0-9.]/g, '')) || null : null,
        plot_number: formData.plot_number || null,
        facade: formData.facade || null,
        building_status: formData.building_status || null,
        furnishing_status: formData.furnishing_status || null,
        is_furnished: formData.is_furnished ?? false,
        rooms: formData.rooms === '' ? 0 : Number(formData.rooms),
        bedrooms: formData.bedrooms === '' || formData.bedrooms === undefined ? null : Number(formData.bedrooms),
        bathrooms: formData.bathrooms === '' ? 0 : Number(formData.bathrooms),
        price_type: formData.price_type,
        pricing_type: formData.pricing_type || (formData.price_type === 'على السوم' ? 'bidding' : 'fixed'),
        is_negotiable: formData.is_negotiable ?? false,
        last_bid: formData.last_bid === '' || formData.last_bid === undefined ? null : Number(formData.last_bid),
        has_no_bids: formData.has_no_bids ?? true,
        asking_price: formData.asking_price === '' || formData.asking_price === undefined ? null : Number(formData.asking_price),
        price: Number(formData.price),
        ad_license_number: formData.ad_license_number,
        deed_number: formData.deed_number || null,
        national_address_code: formData.national_address_code || null,
        advertiser_relationship: formData.advertiser_relationship || 'broker',
        is_mortgaged: formData.is_mortgaged ?? false,
        has_restrictions: formData.has_restrictions ?? false,
        building_permit_number: formData.building_permit_number || null,
        location_url: formData.location_url || null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        description: formData.description || null,
        images: formData.images || [],
        status: 'available', // ZERO-APPROVAL: published immediately for all searchers
        age_category: formData.age_category || null,
        age_years: formData.age_years === '' ? null : Number(formData.age_years),
        building_age: formData.age_years === '' || formData.age_years === undefined ? null : Number(formData.age_years),
        has_elevator: formData.features?.elevator === true,
        has_sewage: formData.features?.sewage === true,
        has_water: formData.features?.water !== false,
        has_electricity: formData.features?.electricity !== false,
        amenities: Object.entries(formData.features || {})
          .filter(([_, v]) => v === true)
          .map(([k]) => k),
        features: formData.features || {},
      };

      if (officeId && role !== 'admin') {
        payload.office_id = officeId;
      }

      // Show instant optimistic toast notification
      setToast('تم حفظ العقار بنجاح، جاري التحليل الجغرافي بالخلفية 🚀');
      setTimeout(() => setToast(null), 5000);

      let savedProperty: any = null;

      if (formData.id) {
        payload.id = formData.id;
      }

      // 1. Resolve token from Supabase session, AuthContext, or stored auth
      const activeToken = await getAuthToken(token);
      if (!activeToken) {
        alert("انتهت جلستك، يرجى تسجيل الدخول مجدداً");
        return;
      }

      // 2. Save via authenticated backend endpoint with IDOR validation (CWE-862)
      const saveRes = await fetch('http://localhost:5000/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(payload)
      });

      const saveJson = await saveRes.json();
      if (!saveRes.ok || !saveJson.ok) {
        throw new Error(saveJson.error || 'فشل حفظ العقار');
      }
      savedProperty = saveJson.property;

      if (savedProperty && !formData.id) {
        // Trigger matching alert notifications to subscribed Telegram users
        try {
          fetch('http://localhost:5000/api/notify-alerts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              ...savedProperty,
              office_phone: phone || ''
            }),
          }).catch(console.error);
        } catch (e) {
          // Ignore alert notification fail silently
        }

        // Trigger comprehensive AI background enrichment
        try {
          fetch('http://localhost:5000/api/enrich-property', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              property_id: savedProperty.id,
              location_url: savedProperty.location_url,
              description: savedProperty.description,
              features: savedProperty.features,
            }),
          }).catch(console.error);
        } catch (e) {
          // Ignore
        }
      }

      await fetchProperties();
    } catch (saveErr: any) {
      console.error('Error saving property:', saveErr);
      const isDup = saveErr?.message?.includes('العقار مسجل مسبقاً في المنصة');
      const errorMsg = isDup
        ? 'العقار مسجل مسبقاً في المنصة، لا يمكنك نشره مجدداً.'
        : 'فشل حفظ العقار: ' + (saveErr?.message || 'يرجى التحقق من البيانات');
      setToast(errorMsg);
      setTimeout(() => setToast(null), 6000);
      throw saveErr;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/properties/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        console.error('Failed to update status on server');
        fetchProperties();
      }
    } catch (err) {
      console.error(err);
      fetchProperties();
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العقار نهائياً؟')) return;
    try {
      setProperties(prev => prev.filter(p => p.id !== id));
      
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/properties/${id}`, {
        method: 'DELETE',
        headers: {
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'فشل حذف العقار');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'حدث خطأ أثناء حذف العقار');
      fetchProperties();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRemainingDays = (expiresAt?: string) => {
    if (!expiresAt) return 30;
    const diffTime = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const filteredProperties = properties.filter(prop => {
    const matchesSearch = 
      (prop.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.property_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.ad_license_number || '').includes(searchQuery);

    const matchesCategory = categoryFilter === 'all' || prop.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || prop.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: properties.length,
    available: properties.filter(p => p.status === 'available').length,
    soldOrRented: properties.filter(p => p.status === 'sold' || p.status === 'rented').length,
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-950/95 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-md px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm font-bold">
            <span className="text-xl">🚀</span>
            <span>{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="mr-2 text-emerald-400 hover:text-white text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      {!hideHeader && (
        <header className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-b border-emerald-900/40 text-white sticky top-0 z-30 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-2.5 rounded-2xl">
                <Building className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">{officeName}</h1>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    لوحة المكتب
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">{phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              
              {/* Profile Button */}
              <button
                onClick={() => navigate('/profile')}
                className="bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 hover:text-white px-3.5 py-2.5 rounded-xl border border-emerald-800/40 transition-colors flex items-center gap-2 text-xs font-bold"
                title="الملف التعريفي للمكتب"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">الملف التعريفي</span>
              </button>

              <button
                onClick={() => {
                  setEditingProperty(null);
                  setIsModalOpen(true);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عقار</span>
              </button>

              <button
                onClick={handleLogout}
                className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-3 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>

          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">إجمالي العقارات المسجلة</p>
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-2xl text-slate-600">
              <Home className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 mb-1">العقارات المتاحة حالياً</p>
              <p className="text-2xl font-black text-emerald-700">{stats.available}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">المباعة / المؤجرة</p>
              <p className="text-2xl font-black text-slate-700">{stats.soldOrRented}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-2xl text-slate-600">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Actions Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                placeholder="ابحث بالحي، نوع العقار، ترخيص فال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              
              {/* Category Pills */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
                {(['all', 'بيع', 'إيجار'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      categoryFilter === cat
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === 'all' ? 'الكل' : cat === 'بيع' ? 'للبيع' : 'للإيجار'}
                  </button>
                ))}
              </div>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="sold">تم البيع</option>
                <option value="rented">تم التأجير</option>
                <option value="reserved">محجوز</option>
              </select>

              {/* View Switcher (Grid vs Map) */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>بطاقات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'map'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>الخريطة</span>
                </button>
              </div>

              {/* Add Property Button */}
              <button
                type="button"
                onClick={() => {
                  setEditingProperty(null);
                  setIsModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all mr-auto"
              >
                <Plus className="w-4 h-4" />
                <span>➕ إضافة عقار جديد</span>
              </button>

            </div>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === 'map' ? (
          <div className="mb-8">
            <MapComponent
              height="650px"
              initialCity="الأحساء"
              onSelectProperty={(prop) => {
                setEditingProperty(prop);
                setIsModalOpen(true);
              }}
            />
          </div>
        ) : loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
            <p className="text-sm font-bold text-slate-500">جاري تحميل العقارات...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <Home className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">لا توجد عقارات مطابقة</h3>
            <p className="text-xs text-slate-400 mb-6">ابدأ بإضافة أول إعلان عقاري ليظهر في لوحة التحكم وبوت التيليجرام</p>
            <button
              onClick={() => {
                setEditingProperty(null);
                setIsModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-md transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عقار جديد</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((prop) => {
              const remainingDays = getRemainingDays(prop.expires_at);
              const statusCfg = STATUS_CONFIG[prop.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.available;
              
              return (
                <div 
                  key={prop.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  
                  {/* Property Card Top Image / Badge */}
                  <div>
                    <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                      {prop.images && prop.images.length > 0 ? (
                        <img 
                          src={prop.images[0]} 
                          alt={prop.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-gradient-to-br from-slate-100 to-slate-200">
                          <Home className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-bold text-slate-400">لا توجد صورة</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <span className={`absolute top-3 right-3 text-xs font-extrabold px-3 py-1 rounded-xl shadow-md ${
                        prop.category === 'بيع' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {prop.category === 'بيع' ? 'للبيع' : 'للإيجار'} • {prop.property_type}
                      </span>

                      {/* Remaining Days Countdown */}
                      <div className={`absolute bottom-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-md flex items-center gap-1 shadow-sm ${
                        remainingDays <= 3 
                          ? 'bg-rose-500/90 text-white' 
                          : remainingDays <= 7 
                          ? 'bg-amber-500/90 text-white' 
                          : 'bg-slate-900/80 text-white'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>متبقي {remainingDays} يوم</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      
                      <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2" title={prop.title}>
                        {prop.title}
                      </h3>

                      {/* Price & Location */}
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-emerald-700 font-black text-lg">
                          {new Intl.NumberFormat('ar-SA').format(prop.price)}
                          <span className="text-xs font-semibold text-slate-500 mr-1">ر.س</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prop.district}، {prop.city}</span>
                        </div>
                      </div>

                      {/* Specs Badges with explicit m² */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                          📐 {prop.area_sqm} م²
                        </span>
                        {prop.rooms > 0 && (
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                            🛏️ {prop.rooms} غرف
                          </span>
                        )}
                        {prop.bathrooms > 0 && (
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                            🚿 {prop.bathrooms} حمامات
                          </span>
                        )}
                        {prop.facade && (
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                            🧭 {prop.facade}
                          </span>
                        )}
                      </div>

                      {/* License Number & Badges */}
                      <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ترخيص الإعلان:</span>
                          </span>
                          <span className="font-mono text-slate-700">{prop.ad_license_number || 'غير مدخل'}</span>
                        </div>
                        {prop.fal_license_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">رخصة فال:</span>
                            <span className="font-mono text-slate-700">{prop.fal_license_number}</span>
                          </div>
                        )}
                        {(prop.is_mortgaged || prop.has_restrictions) && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {prop.is_mortgaged && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                                ⚠️ مرهون
                              </span>
                            )}
                            {prop.has_restrictions && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                                ⚠️ قيود على الصك
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {(() => {
                        const placesText = formatNearbyPlaces(prop.nearby_places);
                        if (!placesText) return null;
                        return (
                          <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 line-clamp-2" title={placesText}>
                            ✨ <span className="font-bold">المعالم القريبة:</span> {placesText}
                          </p>
                        );
                      })()}

                    </div>
                  </div>

                  {/* Card Bottom: Quick Status Switcher & Actions */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 rounded-b-3xl space-y-3">
                    
                    {/* Status Button Group */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1">تحديث الحالة السريعة:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['available', 'sold', 'rented', 'reserved'] as const).map((st) => {
                          const cfg = STATUS_CONFIG[st];
                          const isActive = prop.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(prop.id, st)}
                              className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all ${
                                isActive 
                                  ? `${cfg.color} shadow-sm scale-95` 
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Edit / Delete Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      
                      {prop.location_url && (
                        <a
                          href={prop.location_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>الخريطة</span>
                        </a>
                      )}

                      <div className="flex items-center gap-1.5 mr-auto">
                        <button
                          onClick={() => {
                            setEditingProperty(prop);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="تعديل العقار"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="حذف العقار"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Add / Edit Property Modal */}
      <AddPropertyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProperty(null);
        }}
        onSave={handleSaveProperty}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingProperty(null);
          fetchProperties();
        }}
        initialData={editingProperty}
        officeId={officeId}
      />

    </div>
  );
}
