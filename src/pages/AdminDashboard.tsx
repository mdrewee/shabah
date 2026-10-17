import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, getAuthToken } from '../lib/supabaseClient';
import { 
  LogOut, Crown, Users, Building, Home, CheckCircle2, XCircle, Clock, 
  ShieldCheck, RefreshCw, MapPin, Check, Edit2, Trash2, CreditCard,
  Tag, Percent, Plus, AlertCircle
} from 'lucide-react';
import OfficeDashboard from './OfficeDashboard';

type Stats = {
  offices: number;
  properties: number;
  users: number;
  pendingDistricts: number;
  pendingSubs: number;
  activePromoCodes: number;
};

type Office = {
  id: string;
  name: string;
  phone: string;
  fal_license: string;
  subscription_status: string;
  trial_ends_at: string;
  created_at: string;
};

type CustomDistrict = {
  id: string;
  city: string;
  district_name: string;
  created_by_office_id?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  offices?: {
    name: string;
    phone: string;
  };
};

type SubscriptionRequest = {
  id: string;
  user_id?: string;
  office_id?: string;
  plan_code: string;
  amount: number;
  reference_number: string;
  receipt_image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type PromoCode = {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  usage_type: 'limited' | 'unlimited_period';
  max_uses?: number | null;
  times_used: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminDashboard() {
  const { phone, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'offices' | 'properties' | 'districts' | 'subscriptions' | 'promo_codes'>('offices');
  const [stats, setStats] = useState<Stats>({ offices: 0, properties: 0, users: 0, pendingDistricts: 0, pendingSubs: 0, activePromoCodes: 0 });
  const [offices, setOffices] = useState<Office[]>([]);
  const [customDistricts, setCustomDistricts] = useState<CustomDistrict[]>([]);
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    usage_type: 'limited' as 'limited' | 'unlimited_period',
    max_uses: '100',
    end_date: '',
    is_active: true
  });
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit district modal/prompt state
  const [editingDistrict, setEditingDistrict] = useState<CustomDistrict | null>(null);
  const [newDistrictName, setNewDistrictName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const activeToken = await getAuthToken(token);
      const res = await fetch('http://localhost:5000/api/admin/promo-codes', {
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.ok) {
        setPromoCodes(data.promo_codes || []);
        const activeCount = (data.promo_codes || []).filter((p: any) => p.is_active).length;
        setStats(prev => ({ ...prev, activePromoCodes: activeCount }));
      }
    } catch (err) {
      console.error('Error fetching promo codes:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [officesRes, propertiesRes, usersRes, pendingDistrictsRes, pendingSubsRes] = await Promise.all([
        supabase.from('offices').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('custom_districts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats(prev => ({
        ...prev,
        offices: officesRes.count || 0,
        properties: propertiesRes.count || 0,
        users: usersRes.count || 0,
        pendingDistricts: pendingDistrictsRes.count || 0,
        pendingSubs: pendingSubsRes.count || 0,
      }));

      const { data: officesData } = await supabase
        .from('offices')
        .select('*')
        .order('created_at', { ascending: false });
      setOffices(officesData || []);

      const { data: districtsData } = await supabase
        .from('custom_districts')
        .select('*, offices(name, phone)')
        .order('created_at', { ascending: false });
      setCustomDistricts((districtsData as any) || []);

      const { data: subsData } = await supabase
        .from('subscription_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setSubRequests(subsData || []);

      await fetchPromoCodes();

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Promo Code Handlers
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoForm.code.trim()) {
      setPromoError('يرجى إدخال كود الخصم');
      return;
    }
    const val = Number(promoForm.discount_value);
    if (!val || val <= 0) {
      setPromoError('يرجى إدخال قيمة خصم صالحة أكبر من صفر');
      return;
    }
    if (promoForm.discount_type === 'percentage' && val > 100) {
      setPromoError('نسبة الخصم لا يمكن أن تتجاوز 100%');
      return;
    }
    if (!promoForm.end_date) {
      setPromoError('يرجى تحديد تاريخ نهاية صلاحية الكود');
      return;
    }

    setPromoSubmitting(true);
    try {
      const payload: any = {
        code: promoForm.code.trim().toUpperCase(),
        discount_type: promoForm.discount_type,
        discount_value: val,
        usage_type: promoForm.usage_type,
        max_uses: promoForm.usage_type === 'limited' ? (Number(promoForm.max_uses) || 1) : null,
        end_date: new Date(promoForm.end_date).toISOString(),
        is_active: promoForm.is_active
      };

      const activeToken = await getAuthToken(token);
      const res = await fetch('http://localhost:5000/api/admin/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        setIsCreatingPromo(false);
        setPromoForm({
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          usage_type: 'limited',
          max_uses: '100',
          end_date: '',
          is_active: true
        });
        fetchPromoCodes();
      } else {
        setPromoError(data.error || 'حدث خطأ أثناء إنشاء كود الخصم');
      }
    } catch (err: any) {
      setPromoError(err.message || 'تعذر الاتصال بالخادم');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleTogglePromo = async (id: string) => {
    try {
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/admin/promo-codes/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.ok) {
        setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, is_active: data.promo_code.is_active } : p));
        fetchPromoCodes();
      } else {
        alert(data.error || 'فشل تغيير حالة الكود');
      }
    } catch (err) {
      console.error('Error toggling promo:', err);
    }
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف كود الخصم "${code}" نهائياً؟`)) return;
    try {
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
        headers: {
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.ok) {
        setPromoCodes(prev => prev.filter(p => p.id !== id));
        fetchPromoCodes();
      } else {
        alert(data.error || 'فشل حذف كود الخصم');
      }
    } catch (err) {
      console.error('Error deleting promo:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSubscription = async (officeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'expired' : 'active';
    try {
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/admin/offices/${officeId}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ subscription_status: newStatus })
      });

      if (!res.ok) throw new Error('فشل تحديث الاشتراك من السيرفر');
      setOffices(offices.map(o => o.id === officeId ? { ...o, subscription_status: newStatus } : o));
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('حدث خطأ أثناء تحديث حالة الاشتراك');
    }
  };

  const extendTrial = async (officeId: string) => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const newTrialEnds = date.toISOString();

    try {
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/admin/offices/${officeId}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ 
          subscription_status: 'trial',
          trial_ends_at: newTrialEnds 
        })
      });

      if (!res.ok) throw new Error('فشل تمديد الفترة من السيرفر');

      setOffices(offices.map(o => o.id === officeId ? { 
        ...o, 
        subscription_status: 'trial', 
        trial_ends_at: newTrialEnds 
      } : o));
    } catch (error) {
      console.error('Error extending trial:', error);
      alert('حدث خطأ أثناء تمديد الفترة التجريبية');
    }
  };

  // Approve Subscription Request
  const handleApproveSubscription = async (reqId: string) => {
    try {
      const activeToken = await getAuthToken(token);
      const response = await fetch('http://localhost:5000/api/subscription/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ requestId: reqId })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ تم تفعيل الاشتراك بنجاح!');
        fetchData();
      } else {
        alert(data.error || 'حدث خطأ أثناء التفعيل');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('تعذر الاتصال بالخادم.');
    }
  };

  // Approve custom district
  const handleApproveDistrict = async (id: string) => {
    try {
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/admin/districts/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (!res.ok) throw new Error('فشل الاعتماد');

      setCustomDistricts(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d));
      setStats(prev => ({ ...prev, pendingDistricts: Math.max(0, prev.pendingDistricts - 1) }));
    } catch (err) {
      console.error('Error approving district:', err);
      alert('حدث خطأ أثناء اعتماد الحي');
    }
  };

  // Reject custom district
  const handleRejectDistrict = async (id: string) => {
    try {
      const activeToken = await getAuthToken(token);
      const res = await fetch(`http://localhost:5000/api/admin/districts/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (!res.ok) throw new Error('فشل الرفض');

      setCustomDistricts(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
      setStats(prev => ({ ...prev, pendingDistricts: Math.max(0, prev.pendingDistricts - 1) }));
    } catch (err) {
      console.error('Error rejecting district:', err);
      alert('حدث خطأ أثناء رفض الحي');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans dir-rtl" dir="rtl">
      
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide flex items-center gap-2">
                <span>لوحة الإدارة العليا</span>
                <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  سوبر أدمن
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono" dir="ltr">
                {phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Building className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">المكاتب المسجلة</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.offices}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><Home className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">إجمالي العقارات</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.properties}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">المستخدمين</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.users}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl"><MapPin className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">أحياء معلقة</p>
              <p className="text-2xl font-black text-amber-600 mt-0.5">{stats.pendingDistricts}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="bg-purple-50 text-purple-600 p-3 rounded-xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">طلبات اشتراك</p>
              <p className="text-2xl font-black text-purple-600 mt-0.5">{stats.pendingSubs}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="bg-teal-50 text-teal-600 p-3 rounded-xl"><Tag className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">أكواد نشطة</p>
              <p className="text-2xl font-black text-teal-600 mt-0.5">{stats.activePromoCodes}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('offices')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition relative whitespace-nowrap ${
              activeTab === 'offices' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>إدارة المكاتب العقارية</span>
          </button>

          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition relative whitespace-nowrap ${
              activeTab === 'properties' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>جميع العقارات المنشورة</span>
          </button>

          <button
            onClick={() => setActiveTab('districts')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition relative whitespace-nowrap ${
              activeTab === 'districts' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>الأحياء المقترحة</span>
            {stats.pendingDistricts > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingDistricts}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition relative whitespace-nowrap ${
              activeTab === 'subscriptions' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>طلبات التحويل والاشتراكات</span>
            {stats.pendingSubs > 0 && (
              <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingSubs}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('promo_codes')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition relative whitespace-nowrap ${
              activeTab === 'promo_codes' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>أكواد الخصم</span>
            {stats.activePromoCodes > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.activePromoCodes}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content: Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">طلبات الاشتراكات والتحويلات البنكية</h3>
                <p className="text-xs text-slate-500 mt-1">مراجعة إشعارات التحويل واعتماد تفعيل الباقات</p>
              </div>
            </div>

            {subRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">لا توجد طلبات اشتراك مسجلة حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">الرقم المرجعي</th>
                      <th className="py-3 px-4">الباقة</th>
                      <th className="py-3 px-4">المبلغ</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{req.reference_number}</td>
                        <td className="py-3.5 px-4 font-medium">{req.plan_code}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">{req.amount} ر.س</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">{new Date(req.created_at).toLocaleDateString('ar-SA')}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {req.status === 'approved' ? 'مفعل ومؤكد' : 'معلق بانتظار التحقق'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleApproveSubscription(req.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              اعتماد وتفعيل فوراً
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Offices */}
        {activeTab === 'offices' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">قائمة المكاتب العقارية</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">اسم المكتب</th>
                    <th className="py-3 px-4">رقم الجوال</th>
                    <th className="py-3 px-4">رخصة فال</th>
                    <th className="py-3 px-4">حالة الاشتراك</th>
                    <th className="py-3 px-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {offices.map((office) => (
                    <tr key={office.id}>
                      <td className="py-3.5 px-4 font-bold">{office.name}</td>
                      <td className="py-3.5 px-4 font-mono text-xs" dir="ltr">{office.phone}</td>
                      <td className="py-3.5 px-4 text-xs">{office.fal_license || 'غير مسجلة'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          office.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {office.subscription_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 flex gap-2">
                        <button
                          onClick={() => toggleSubscription(office.id, office.subscription_status)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded font-medium"
                        >
                          تبديل الحالة
                        </button>
                        <button
                          onClick={() => extendTrial(office.id)}
                          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded font-medium"
                        >
                          تمديد تجريبي 30 يوم
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Custom Districts */}
        {activeTab === 'districts' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">الأحياء المقترحة من المكاتب العقارية</h3>
                <p className="text-xs text-slate-500 mt-1">مراجعة واعتماد أو رفض الأحياء المضافة يدوياً من الوسطاء</p>
              </div>
            </div>

            {customDistricts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">لا توجد أحياء مقترحة حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">اسم الحي</th>
                      <th className="py-3 px-4">المدينة</th>
                      <th className="py-3 px-4">المكتب المقترح</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customDistricts.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-800">{d.district_name}</td>
                        <td className="py-3.5 px-4">{d.city}</td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                          {d.offices?.name || 'غير معروف'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(d.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            d.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            d.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {d.status === 'approved' ? 'معتمد ومضاف' : d.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {d.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveDistrict(d.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                              >
                                اعتماد الحي
                              </button>
                              <button
                                onClick={() => handleRejectDistrict(d.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                              >
                                رفض
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Promo Codes */}
        {activeTab === 'promo_codes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600" />
                  <span>إدارة وتوليد أكواد الخصم</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  إنشاء كوبونات ترويجية وتخفيضات خاصة على باقات الاشتراكات للمكاتب والمسوقين
                </p>
              </div>
              <button
                onClick={() => setIsCreatingPromo(!isCreatingPromo)}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingPromo ? 'إلغاء الإضافة' : 'إنشاء كود خصم جديد'}</span>
              </button>
            </div>

            {/* Create Promo Code Form */}
            {isCreatingPromo && (
              <form onSubmit={handleCreatePromo} className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-600" />
                    <span>بيانات كود الخصم الجديد</span>
                  </h4>
                  <span className="text-xs text-slate-400">جميع الحقول بعلامة (*) مطلوبة</span>
                </div>

                {promoError && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{promoError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      كود الخصم <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: MAYYAZ50"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold uppercase bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      dir="ltr"
                      required
                    />
                  </div>

                  {/* Discount Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      نوع الخصم <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={promoForm.discount_type}
                      onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value as any })}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ مالي ثابت (ر.س)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      قيمة الخصم {promoForm.discount_type === 'percentage' ? '(%)' : '(ر.س)'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder={promoForm.discount_type === 'percentage' ? 'مثال: 25' : 'مثال: 100'}
                      value={promoForm.discount_value}
                      onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                      min="1"
                      max={promoForm.discount_type === 'percentage' ? '100' : undefined}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      required
                    />
                  </div>

                  {/* Usage Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      نوع الاستخدام <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={promoForm.usage_type}
                      onChange={(e) => setPromoForm({ ...promoForm, usage_type: e.target.value as any })}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    >
                      <option value="limited">عدد مرات استخدام محدد</option>
                      <option value="unlimited_period">غير محدود خلال الفترة المحددة</option>
                    </select>
                  </div>

                  {/* Max Uses */}
                  {promoForm.usage_type === 'limited' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        الحد الأقصى للاستخدام <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        value={promoForm.max_uses}
                        onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                        min="1"
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                        required
                      />
                    </div>
                  )}

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      تاريخ نهاية الصلاحية <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={promoForm.end_date}
                      onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPromo(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={promoSubmitting}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{promoSubmitting ? 'جاري الإنشاء...' : 'حفظ ونشر الكود فوراً'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Promo Codes Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">كود الخصم</th>
                      <th className="py-3 px-4">قيمة الخصم</th>
                      <th className="py-3 px-4">نوع الاستخدام</th>
                      <th className="py-3 px-4">الاستهلاك</th>
                      <th className="py-3 px-4">تاريخ الانتهاء</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {promoCodes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          لا توجد أكواد خصم منشأة حالياً. أنشئ أول كود خصم بالضغط على الزر أعلاه!
                        </td>
                      </tr>
                    ) : (
                      promoCodes.map((promo) => {
                        const isExpired = new Date(promo.end_date) < new Date();
                        const isMaxed = promo.usage_type === 'limited' && promo.max_uses !== null && promo.times_used >= (promo.max_uses || 1);
                        return (
                          <tr key={promo.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-mono font-black text-slate-800 tracking-wider text-base">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                {promo.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-600">
                              {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `${promo.discount_value} ر.س`}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600">
                              {promo.usage_type === 'limited' ? 'محدود بالعدد' : 'غير محدود بالفترة'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs">
                              <span className="font-bold text-slate-800">{promo.times_used}</span>
                              <span className="text-slate-400"> / {promo.usage_type === 'limited' ? (promo.max_uses ?? '∞') : '∞'}</span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                              {new Date(promo.end_date).toLocaleDateString('ar-SA')}
                              {isExpired && <span className="text-rose-500 font-bold mr-1.5">(منتهي)</span>}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                promo.is_active && !isExpired && !isMaxed
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {promo.is_active && !isExpired && !isMaxed ? 'نشط وفعال' : 'معطل'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 flex items-center gap-2">
                              <button
                                onClick={() => handleTogglePromo(promo.id)}
                                className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                                  promo.is_active 
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {promo.is_active ? 'تعطيل' : 'تفعيل'}
                              </button>
                              <button
                                onClick={() => handleDeletePromo(promo.id, promo.code)}
                                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg transition"
                                title="حذف الكود نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Properties */}
        {activeTab === 'properties' && (
          <OfficeDashboard />
        )}

      </main>
    </div>
  );
}
