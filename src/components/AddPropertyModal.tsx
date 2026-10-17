import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Upload, MapPin, DollarSign, ShieldCheck, Home, FileText, Image as ImageIcon, Search, Droplets, Sparkles, ChevronDown, Plus, Check, Navigation } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../lib/supabase';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

export interface PropertyFormData {
  id?: string;
  title: string;
  category: 'بيع' | 'إيجار' | '';
  property_type: string;
  city: string;
  district: string;
  project_name?: string;
  parent_building_id?: string;
  length?: number | '';
  width?: number | '';
  area_sqm: number | '';
  street_width?: string;
  street_width_m?: number | '';
  plot_number?: string;
  facade: string;
  building_status?: string;
  furnishing_status?: string;
  rooms?: number | '';
  bedrooms?: number | '';
  bathrooms?: number | '';
  price_type: 'سعر محدد' | 'على السوم';
  pricing_type?: 'fixed' | 'bidding';
  is_negotiable?: boolean;
  last_bid?: number | '';
  has_no_bids?: boolean;
  asking_price?: number | '';
  price: number | '';
  ad_license_number: string;
  is_furnished?: boolean;
  deed_number?: string;
  national_address_code?: string;
  advertiser_relationship?: 'owner' | 'agent' | 'broker';
  is_mortgaged?: boolean;
  has_restrictions?: boolean;
  building_permit_number?: string;
  location_url?: string;
  latitude?: number | '';
  longitude?: number | '';
  description?: string;
  images: string[];
  status: 'available' | 'sold' | 'rented' | 'reserved';
  age_category?: string;
  age_years?: number | '';
  building_age?: number | '';
  has_elevator?: boolean;
  has_sewage?: boolean;
  has_water?: boolean;
  has_electricity?: boolean;
  amenities?: string[];
  features?: Record<string, boolean | null>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: PropertyFormData) => Promise<void> | void;
  onSuccess?: () => void;
  initialData?: PropertyFormData | null;
  officeId?: string | null;
}

export const PROPERTY_TYPES = [
  'بيت',
  'بيت شعبي',
  'شقة',
  'فيلا',
  'عمارة سكنية',
  'أرض سكنية',
  'استراحة',
  'عمارة تجارية',
  'أرض تجارية',
  'شاليه',
  'أرض زراعية',
  'مستودع',
  'مزرعة',
  'أرض صناعية',
  'دبلكس',
  'دور',
  'ملحق'
];

export const FACADES = [
  'شمالية',
  'جنوبية',
  'شرقية',
  'غربية',
  'شمالية شرقية',
  'شمالية غربية',
  'جنوبية شرقية',
  'جنوبية غربية'
];

export const TRISTATE_FEATURES = [
  { key: 'water', label: 'شبكة ماء' },
  { key: 'electricity', label: 'شبكة كهرباء' },
  { key: 'sewage', label: 'صرف صحي' },
  { key: 'kitchen', label: 'مطبخ راكب' },
  { key: 'car_entrance', label: 'مدخل سيارة / بايكة' },
  { key: 'elevator', label: 'مصعد' },
  { key: 'ac', label: 'تكييف راكب' },
  { key: 'maid_room', label: 'غرفة خادمة' },
  { key: 'driver_room', label: 'غرفة سائق' },
  { key: 'courtyard', label: 'حوش' },
  { key: 'private_roof', label: 'سطح خاص' },
  { key: 'pool', label: 'مسبح' },
];

export default function AddPropertyModal({ isOpen, onClose, onSave, onSuccess, initialData, officeId }: Props) {
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    category: '',
    property_type: '',
    city: '',
    district: '',
    project_name: '',
    parent_building_id: '',
    length: '',
    width: '',
    area_sqm: '',
    street_width: '',
    plot_number: '',
    facade: '',
    building_status: '',
    furnishing_status: '',
    rooms: '',
    bedrooms: '',
    bathrooms: '',
    price_type: 'سعر محدد',
    pricing_type: 'fixed',
    is_negotiable: false,
    last_bid: '',
    has_no_bids: true,
    asking_price: '',
    price: '',
    ad_license_number: '',
    is_furnished: false,
    deed_number: '',
    national_address_code: '',
    advertiser_relationship: 'broker',
    is_mortgaged: false,
    has_restrictions: false,
    building_permit_number: '',
    location_url: '',
    description: '',
    images: [],
    status: 'available',
    age_category: '',
    age_years: '',
    features: {},
  });

  const [districtsList, setDistrictsList] = useState<{ city: string; name_ar: string }[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Creatable Combobox state for district
  const [districtInput, setDistrictInput] = useState('');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  // Accordion state
  const [showExtraDetails, setShowExtraDetails] = useState(false);

  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});

  // Outlier confirmation state & calculations (Requirement 3)
  const [confirmedPriceOutlier, setConfirmedPriceOutlier] = useState(false);

  const effectivePrice = useMemo(() => {
    if (formData.pricing_type === 'bidding' || formData.price_type === 'على السوم') {
      return Number(formData.asking_price) || Number(formData.last_bid) || 0;
    }
    return Number(formData.price) || 0;
  }, [formData.pricing_type, formData.price_type, formData.asking_price, formData.last_bid, formData.price]);

  const pricePerMeter = useMemo(() => {
    const area = Number(formData.area_sqm);
    if (area > 0 && effectivePrice > 0) {
      return Math.round(effectivePrice / area);
    }
    return 0;
  }, [effectivePrice, formData.area_sqm]);

  const isPriceOutlier = useMemo(() => {
    if (formData.category === 'بيع') {
      if (pricePerMeter > 0 && (pricePerMeter < 500 || pricePerMeter > 15000)) {
        return true;
      }
    } else if (formData.category === 'إيجار') {
      if (effectivePrice > 0 && effectivePrice < 5000 && (formData.property_type === 'شقة' || formData.property_type === 'دور' || !formData.property_type)) {
        return true;
      }
    }
    return false;
  }, [formData.category, pricePerMeter, effectivePrice, formData.property_type]);

  // Mapbox Interactive Snapping & Auto-Fill state (Requirement 4)
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [geoSnappingStatus, setGeoSnappingStatus] = useState<string | null>(null);

  const handlePositionUpdate = async (lng: number, lat: number) => {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));

    setFormData(prev => ({
      ...prev,
      latitude: cleanLat,
      longitude: cleanLng,
      location_url: `https://www.google.com/maps?q=${cleanLat},${cleanLng}`
    }));

    try {
      // 1. Auto-detect district and city (Requirement 1 & 4)
      const { data: distData } = await supabase.rpc('detect_district_from_point', {
        p_lon: cleanLng,
        p_lat: cleanLat
      });
      if (distData && distData.length > 0) {
        const d = distData[0];
        setFormData(prev => ({
          ...prev,
          city: d.city_name || prev.city,
          district: d.district_name || prev.district
        }));
        setCitySearch(d.city_name || '');
        setDistrictInput(d.district_name || '');
        setGeoSnappingStatus(`✅ تم تحديد الحي: حي ${d.district_name} (${d.city_name})`);
        if (invalidFields.city) setInvalidFields(prev => ({ ...prev, city: false }));
        if (invalidFields.district) setInvalidFields(prev => ({ ...prev, district: false }));
      }

      // 2. Auto-detect parcel & plot (Requirement 4)
      const { data: parcelData } = await supabase.rpc('detect_parcel_from_point', {
        p_lon: cleanLng,
        p_lat: cleanLat
      });
      if (parcelData && parcelData.length > 0) {
        const p = parcelData[0];
        if (p.plan_number && p.parcel_number) {
          const plotStr = `مخطط ${p.plan_number} قطعة ${p.parcel_number}`;
          setFormData(prev => ({
            ...prev,
            plot_number: prev.plot_number || plotStr,
            area_sqm: prev.area_sqm || (p.area_sqm ? Number(p.area_sqm) : prev.area_sqm)
          }));
        }
      }
    } catch (err) {
      console.warn('[Mapbox Snapping] RPC error:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialLon = formData.longitude ? Number(formData.longitude) : 49.586;
      const initialLat = formData.latitude ? Number(formData.latitude) : 25.383;

      if (!mapRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [initialLon, initialLat],
          zoom: formData.latitude && formData.longitude ? 14 : 11
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-left');

        const marker = new mapboxgl.Marker({
          draggable: true,
          color: '#059669'
        })
          .setLngLat([initialLon, initialLat])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          handlePositionUpdate(lngLat.lng, lngLat.lat);
        });

        map.on('click', (e) => {
          marker.setLngLat(e.lngLat);
          handlePositionUpdate(e.lngLat.lng, e.lngLat.lat);
        });

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        mapRef.current.resize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleLocationUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, location_url: url }));
    
    // Check if coordinates exist in URL
    const match = url.match(/[@?&]q?=?(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || url.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (lat >= 16 && lat <= 33 && lon >= 34 && lon <= 56) {
        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo({ center: [lon, lat], zoom: 14 });
          markerRef.current.setLngLat([lon, lat]);
        }
        handlePositionUpdate(lon, lat);
      }
    }
  };

  // Dynamic fetch of districts from Supabase (Requirement 5)
  useEffect(() => {
    let isMounted = true;
    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('city, name_ar')
          .order('name_ar');

        if (!error && data && isMounted) {
          setDistrictsList(data);
        }
      } catch (e) {
        console.warn('Could not load districts from Supabase:', e);
      } finally {
        if (isMounted) setLoadingDistricts(false);
      }
    }
    loadDistricts();
    return () => { isMounted = false; };
  }, []);

  // Deduplicate and prepare cities dynamically
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    for (const d of districtsList) {
      if (d.city) set.add(d.city.trim());
    }
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'ar'))
      .map(name => ({ name_ar: name }));
  }, [districtsList]);

  // Filter cities by search term
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return uniqueCities.slice(0, 50);
    const query = citySearch.trim().toLowerCase();
    return uniqueCities.filter(c => c.name_ar.toLowerCase().includes(query)).slice(0, 50);
  }, [uniqueCities, citySearch]);

  // Dynamic districts based on selected city (Cascading dropdown)
  const availableDistricts = useMemo(() => {
    if (!formData.city) return [];
    const cleanCity = formData.city.trim();
    return districtsList
      .filter(d => d.city === cleanCity)
      .map(d => d.name_ar.replace(/^حي\s+/, ''))
      .sort((a, b) => a.localeCompare(b, 'ar'));
  }, [districtsList, formData.city]);

  // Filter districts matching current user input in combobox
  const filteredDistricts = useMemo(() => {
    if (!districtInput.trim()) return availableDistricts.slice(0, 30);
    const q = districtInput.trim().toLowerCase();
    return availableDistricts.filter(d => d.toLowerCase().includes(q)).slice(0, 30);
  }, [availableDistricts, districtInput]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        project_name: initialData.project_name || '',
        parent_building_id: initialData.parent_building_id || '',
        pricing_type: initialData.pricing_type || (initialData.price_type === 'على السوم' ? 'bidding' : 'fixed'),
        is_negotiable: initialData.is_negotiable ?? false,
        last_bid: initialData.last_bid ?? '',
        has_no_bids: initialData.has_no_bids ?? true,
        asking_price: initialData.asking_price ?? '',
        advertiser_relationship: initialData.advertiser_relationship || 'broker',
        is_mortgaged: initialData.is_mortgaged ?? false,
        has_restrictions: initialData.has_restrictions ?? false,
        is_furnished: initialData.is_furnished || false,
        deed_number: initialData.deed_number || '',
        national_address_code: initialData.national_address_code || '',
        building_permit_number: initialData.building_permit_number || '',
      });
      setCitySearch(initialData.city || '');
      setDistrictInput(initialData.district || '');
      setConfirmedPriceOutlier(false);
    } else {
      // EMPTY INITIAL STATE: No presets to force user selection
      setCitySearch('');
      setDistrictInput('');
      setConfirmedPriceOutlier(false);
      setFormData({
        title: '',
        category: '',
        property_type: '',
        city: '',
        district: '',
        project_name: '',
        parent_building_id: '',
        length: '',
        width: '',
        area_sqm: '',
        street_width: '',
        plot_number: '',
        facade: '',
        building_status: '',
        furnishing_status: '',
        rooms: '',
        bedrooms: '',
        bathrooms: '',
        price_type: 'سعر محدد',
        pricing_type: 'fixed',
        is_negotiable: false,
        last_bid: '',
        has_no_bids: true,
        asking_price: '',
        price: '',
        ad_license_number: '',
        is_furnished: false,
        deed_number: '',
        national_address_code: '',
        advertiser_relationship: 'broker',
        is_mortgaged: false,
        has_restrictions: false,
        building_permit_number: '',
        location_url: '',
        description: '',
        images: [],
        status: 'available',
        age_category: '',
        age_years: '',
        features: {},
      });
    }
  }, [initialData, isOpen, uniqueCities]);

  if (!isOpen) return null;

  // Auto-calculate Area (m²) when Length or Width changes
  const handleDimensionChange = (field: 'length' | 'width', value: string) => {
    const num = value === '' ? '' : Number(value);
    const updated = { ...formData, [field]: num };
    
    if (updated.length && updated.width) {
      updated.area_sqm = Number((Number(updated.length) * Number(updated.width)).toFixed(2));
    }
    setFormData(updated);
  };

  // Tristate cycle: true (✓) -> false (✗) -> null (neutral)
  const cycleFeature = (key: string) => {
    setFormData(prev => {
      const current = prev.features?.[key];
      let next: boolean | null = null;
      if (current === undefined || current === null) next = true;
      else if (current === true) next = false;
      else if (current === false) next = null;

      const newFeatures = { ...(prev.features || {}) };
      if (next === null) {
        delete newFeatures[key];
      } else {
        newFeatures[key] = next;
      }
      return { ...prev, features: newFeatures };
    });
  };

  // Image Upload with WebP Compression & Direct Supabase Storage Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setCompressing(true);
    setError('');
    try {
      const files = Array.from(e.target.files);
      const newImages: string[] = [];

      for (const file of files) {
        if (formData.images.length + newImages.length >= 8) break;

        const options = {
          maxSizeMB: 0.2, // 200KB max
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp'
        };

        const compressedFile = await imageCompression(file, options);
        
        // Generate unique cloud storage path
        const fileExt = 'webp';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `property-images/${fileName}`;

        // Direct upload to Supabase Storage 'properties' bucket
        const { error: uploadErr } = await supabase.storage
          .from('properties')
          .upload(filePath, compressedFile, {
            contentType: 'image/webp',
            upsert: true
          });

        if (uploadErr) {
          console.error('Storage upload failed:', uploadErr);
          throw uploadErr;
        }

        // Get permanent public URL
        const { data: urlData } = supabase.storage
          .from('properties')
          .getPublicUrl(filePath);

        const permanentUrl = urlData.publicUrl;
        if (permanentUrl && permanentUrl.startsWith('http')) {
          newImages.push(permanentUrl);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 8)
      }));
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError('فشل رفع بعض الصور إلى التخزين السحابي. يرجى المحاولة مرة أخرى.');
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field-by-field Validation
    const errors: Record<string, boolean> = {};
    if (!formData.title.trim()) errors.title = true;
    if (!formData.category) errors.category = true;
    if (!formData.property_type) errors.property_type = true;
    if (!formData.city.trim()) errors.city = true;
    if (!formData.district.trim()) errors.district = true;
    if (!formData.area_sqm || Number(formData.area_sqm) <= 0) errors.area_sqm = true;
    
    // Pricing validation
    if (formData.pricing_type === 'bidding' || formData.price_type === 'على السوم') {
      if (formData.has_no_bids === false && (!formData.last_bid || Number(formData.last_bid) <= 0)) {
        errors.last_bid = true;
      }
    } else {
      if (!formData.price || Number(formData.price) <= 0) errors.price = true;
    }

    if (!formData.ad_license_number.trim()) errors.ad_license_number = true;

    if (Object.keys(errors).length > 0) {
      setError('يرجى تعبئة الحقول الإجبارية المطلوبة المحددة');
      setInvalidFields(errors);

      // Scroll-to-Error: find first error element and scroll smoothly to it
      setTimeout(() => {
        const firstError = document.querySelector('.input-error, :invalid');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstError as HTMLElement).focus();
        }
      }, 50);
      return;
    }

    // Reset invalid errors
    setInvalidFields({});

    // 1. Hard Validation for extreme outliers (Requirement 3)
    if (formData.category === 'بيع') {
      const checkPrice = (formData.pricing_type === 'bidding' || formData.price_type === 'على السوم')
        ? (Number(formData.asking_price) || Number(formData.last_bid) || 0)
        : Number(formData.price);
      
      if (['فيلا', 'بيت', 'بيت شعبي', 'عمارة سكنية', 'عمارة تجارية', 'دبلكس'].includes(formData.property_type) && checkPrice > 0 && checkPrice < 10000) {
        setError(`السعر المدخل (${checkPrice.toLocaleString('ar-SA')} ريال) غير واقعي لعقار من نوع ${formData.property_type}.`);
        return;
      }
      if (['أرض سكنية', 'أرض تجارية', 'أرض زراعية', 'أرض صناعية'].includes(formData.property_type) && checkPrice > 0 && checkPrice <= 10) {
        setError(`السعر المدخل (${checkPrice.toLocaleString('ar-SA')} ريال) غير واقعي للأراضي.`);
        return;
      }
    }

    // 2. Outlier Confirmation Prompt (Requirement 3)
    if (isPriceOutlier && !confirmedPriceOutlier) {
      const ok = window.confirm("هل أنت متأكد من السعر المدخل؟ يبدو غير متوافق مع متوسط الأسعار المعتادة لهذا الحي.");
      if (!ok) {
        setError("يرجى مراجعة وتأكيد السعر المدخل قبل الحفظ.");
        return;
      }
      setConfirmedPriceOutlier(true);
    }

    setSaving(true);
    try {
      // 3. First-Come First-Served Deduplication Check (Requirement 1)
      const { data: dupData, error: dupErr } = await supabase.rpc('check_property_duplicate', {
        p_property_type: formData.property_type || null,
        p_deed_number: formData.deed_number?.trim() || null,
        p_national_address_code: formData.national_address_code?.trim() || null,
        p_lat: formData.latitude ? Number(formData.latitude) : null,
        p_lon: formData.longitude ? Number(formData.longitude) : null,
        p_area_sqm: formData.area_sqm ? Number(formData.area_sqm) : null,
        p_office_id: officeId || null,
        p_exclude_id: formData.id || null
      });

      if (!dupErr && dupData && dupData.is_duplicate) {
        setError('العقار مسجل مسبقاً في المنصة، لا يمكنك نشره مجدداً.');
        setSaving(false);
        return;
      }

      // Check district moderation flow
      const cleanDistrict = formData.district.trim();
      const isOfficial = availableDistricts.some(
        d => d.trim().toLowerCase() === cleanDistrict.toLowerCase()
      );

      // If completely new custom district, record in custom_districts table asynchronously for admin
      if (!isOfficial && cleanDistrict) {
        supabase.from('custom_districts').insert([{
          name: cleanDistrict,
          district_name: cleanDistrict,
          city: formData.city.trim(),
          city_id: null,
          created_by_office_id: officeId || null,
          status: 'pending'
        }]).then(({ error: distErr }: { error: any }) => {
          if (distErr) console.warn('Could not record custom district:', distErr);
        }, (err: any) => console.warn(err));
      }

      const finalPrice = (formData.pricing_type === 'bidding' || formData.price_type === 'على السوم')
        ? (formData.asking_price ? Number(formData.asking_price) : (formData.last_bid ? Number(formData.last_bid) : 0))
        : Number(formData.price);

      const isLand = (formData.property_type || '').includes('أرض') || formData.property_type === 'land';
      const payload: PropertyFormData = {
        ...formData,
        is_furnished: isLand ? false : (formData.is_furnished ?? false),
        price: finalPrice,
        pricing_type: formData.pricing_type || (formData.price_type === 'على السوم' ? 'bidding' : 'fixed'),
        status: 'available', // Zero-approval publishing: available immediately!
      };

      if (onSave) {
        await onSave(payload);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (saveErr: any) {
      console.error('Async property save error:', saveErr);
      const isDup = saveErr?.message?.includes('العقار مسجل مسبقاً في المنصة');
      setError(isDup ? 'العقار مسجل مسبقاً في المنصة، لا يمكنك نشره مجدداً.' : (saveErr?.message || 'حدث خطأ أثناء حفظ العقار'));
    } finally {
      setSaving(false);
    }
  };

  const isBuildingType = ['بيت', 'بيت شعبي', 'شقة', 'فيلا', 'عمارة سكنية', 'عمارة تجارية', 'شاليه', 'مستودع', 'استراحة', 'دور', 'دبلكس', 'ملحق'].includes(formData.property_type);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md">
              <Home className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {initialData ? 'تعديل بيانات العقار' : 'إضافة عقار جديد'}
              </h2>
              <p className="text-xs text-emerald-200/80 mt-0.5">ربط شامل بمدن وأحياء المملكة وتراخيص فال العقارية</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white font-bold flex items-center justify-center w-9 h-9 text-lg"
            title="إغلاق النافذة (✕)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar text-slate-800">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-800 font-bold text-base">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>البيانات الأساسية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  نوع العرض <span className="text-rose-500">*</span>
                </label>
                <div className={`grid grid-cols-2 gap-2 p-0.5 rounded-xl ${invalidFields.category ? 'input-error ring-2 ring-rose-400 border border-rose-500' : ''}`}>
                  {(['إيجار', 'بيع'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: cat });
                        if (invalidFields.category) setInvalidFields(prev => ({ ...prev, category: false }));
                      }}
                      className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                        formData.category === cat
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'بيع' ? 'للبيع' : 'للإيجار'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type (Flexible & Empty Initial) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  نوع العقار <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => {
                    setFormData({ ...formData, property_type: e.target.value });
                    if (invalidFields.property_type) setInvalidFields(prev => ({ ...prev, property_type: false }));
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all ${
                    invalidFields.property_type
                      ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                  }`}
                >
                  <option value="">اختر نوع العقار...</option>
                  {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Searchable City */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  المدينة (بحث بجميع المدن) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCityDropdown(true);
                      if (invalidFields.city) setInvalidFields(prev => ({ ...prev, city: false }));
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="ابحث عن المدينة..."
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none pr-8 transition-all ${
                      invalidFields.city
                        ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>

                {/* City Dropdown Menu */}
                {showCityDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowCityDropdown(false)} 
                    />
                    <div className="absolute z-20 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                      {filteredCities.map((city, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, city: city.name_ar, district: '' });
                            setCitySearch(city.name_ar);
                            setDistrictInput('');
                            setShowCityDropdown(false);
                            if (invalidFields.city) setInvalidFields(prev => ({ ...prev, city: false }));
                          }}
                          className="w-full text-right px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center justify-between"
                        >
                          <span>{city.name_ar}</span>
                        </button>
                      ))}
                      {filteredCities.length === 0 && (
                        <div className="p-3 text-xs text-slate-400 text-center font-medium">
                          لا توجد مدينة مطابقة للبحث
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Creatable Combobox for District */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  الحي (اختيار أو كتابة حي جديد) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={districtInput}
                    onChange={(e) => {
                      setDistrictInput(e.target.value);
                      setFormData({ ...formData, district: e.target.value });
                      setShowDistrictDropdown(true);
                      if (invalidFields.district) setInvalidFields(prev => ({ ...prev, district: false }));
                    }}
                    onFocus={() => setShowDistrictDropdown(true)}
                    placeholder={formData.city ? `اختر أو اكتب الحي (${availableDistricts.length} مقترح)...` : "اختر المدينة أولاً..."}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all ${
                      invalidFields.district
                        ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* District Dropdown Suggestions */}
                {showDistrictDropdown && formData.city && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowDistrictDropdown(false)} 
                    />
                    <div className="absolute z-20 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                      {/* Option to create / confirm typed custom district if not exact match */}
                      {districtInput.trim() && !availableDistricts.some(d => d.toLowerCase() === districtInput.trim().toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, district: districtInput.trim() });
                            setShowDistrictDropdown(false);
                            if (invalidFields.district) setInvalidFields(prev => ({ ...prev, district: false }));
                          }}
                          className="w-full text-right px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" />
                            <span>اعتماد كحي جديد: "{districtInput.trim()}"</span>
                          </span>
                          <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full">جديد</span>
                        </button>
                      )}

                      {filteredDistricts.map((dist, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDistrictInput(dist);
                            setFormData({ ...formData, district: dist });
                            setShowDistrictDropdown(false);
                            if (invalidFields.district) setInvalidFields(prev => ({ ...prev, district: false }));
                          }}
                          className="w-full text-right px-4 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center justify-between"
                        >
                          <span>{dist}</span>
                          {formData.district === dist && (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      ))}

                      {filteredDistricts.length === 0 && !districtInput.trim() && (
                        <div className="p-3 text-xs text-slate-400 text-center font-medium">
                          اكتب اسم الحي للإضافة أو الاختيار
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Title & Project Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  عنوان الإعلان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: بيت للبيع حي المروج تشطيب راقي على شارع 15"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (invalidFields.title) setInvalidFields(prev => ({ ...prev, title: false }));
                  }}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all ${
                    invalidFields.title
                      ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  اسم المشروع / العمارة (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: عمارة الصفا 3، روز ريزيدنس"
                  value={formData.project_name || ''}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dimensions & Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>المساحة والأبعاد</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">حساب تلقائي للمساحة عند إدخال الطول والعرض</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Length */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  الطول الأول / الواجهة (متر)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="مثال: 20"
                  value={formData.length}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Width */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  الطول الثاني / العرض (متر)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="مثال: 15"
                  value={formData.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Area SQM with explicit m² */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  المساحة الإجمالية (م²) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    placeholder="مثال: 300"
                    value={formData.area_sqm}
                    onChange={(e) => {
                      setFormData({ ...formData, area_sqm: e.target.value === '' ? '' : Number(e.target.value) });
                      if (invalidFields.area_sqm) setInvalidFields(prev => ({ ...prev, area_sqm: false }));
                    }}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none pl-10 transition-all ${
                      invalidFields.area_sqm
                        ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                        : 'bg-emerald-50/50 border border-emerald-200 text-emerald-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-700 select-none">م²</span>
                </div>
              </div>

              {/* Street Width */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  عرض الشارع (متر)
                </label>
                <input
                  type="text"
                  placeholder="مثال: 15 أو 20"
                  value={formData.street_width || ''}
                  onChange={(e) => setFormData({ ...formData, street_width: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Specs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-800 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>المواصفات والتفاصيل الفنية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Facade */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  الواجهة
                </label>
                <select
                  value={formData.facade}
                  onChange={(e) => setFormData({ ...formData, facade: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">اختر الواجهة...</option>
                  {FACADES.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>

              {/* Building Status */}
              {isBuildingType && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    حالة البناء
                  </label>
                  <select
                    value={formData.building_status}
                    onChange={(e) => setFormData({ ...formData, building_status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">اختر حالة البناء...</option>
                    <option value="جاهز">جاهز للسكن/الاستخدام</option>
                    <option value="قيد الإنشاء (عظم)">قيد الإنشاء (عظم)</option>
                    <option value="تحت التشطيب">تحت التشطيب</option>
                  </select>
                </div>
              )}

              {/* Furnishing Status */}
              {isBuildingType && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    حالة التأثيث
                  </label>
                  <select
                    value={formData.furnishing_status}
                    onChange={(e) => setFormData({ ...formData, furnishing_status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">اختر حالة التأثيث...</option>
                    <option value="غير مفروش">غير مفروش</option>
                    <option value="نصف مفروش">نصف مفروش / مطبخ وراكب</option>
                    <option value="مفروش بالكامل">مفروش بالكامل</option>
                  </select>
                </div>
              )}

              {/* Rooms */}
              {isBuildingType && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    عدد الغرف الكلي
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="مثال: 4"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              )}

              {/* Bedrooms */}
              {isBuildingType && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    غرف النوم
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="مثال: 3"
                    value={formData.bedrooms ?? ''}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              )}

              {/* Bathrooms */}
              {isBuildingType && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    دورات المياه (الحمامات)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="مثال: 3"
                      value={formData.bathrooms || ''}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-8"
                    />
                    <Droplets className="w-4 h-4 text-blue-500 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Plot / Plan Number */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  رقم المخطط / القطعة
                </label>
                <input
                  type="text"
                  placeholder="مثال: مخطط 45 / قطعة 120"
                  value={formData.plot_number || ''}
                  onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Accordion for Extra Details (Age & Tristate Features) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white transition-all shadow-sm">
            <button
              type="button"
              onClick={() => setShowExtraDetails(!showExtraDetails)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-teal-50/20 hover:bg-slate-100/80 transition-colors text-right"
            >
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>➕ المزيد من المعلومات والمرافق (اختياري)</span>
                <span className="text-[11px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 hidden sm:inline-block">
                  عمر العقار والمرافق ثلاثية الحالات
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${showExtraDetails ? 'rotate-180' : ''}`} />
            </button>

            {showExtraDetails && (
              <div className="p-5 space-y-6 border-t border-slate-100 bg-white animate-in fade-in slide-in-from-top-2 duration-200">
                {/* 1. Property Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    عمر العقار
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Quick Age Select */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'جديد (أقل من سنة)', value: 'جديد' },
                        { label: 'متوسط (1 - 5 سنوات)', value: 'متوسط' },
                        { label: 'قديم (+5 سنوات)', value: 'قديم' },
                      ].map(age => (
                        <button
                          key={age.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, age_category: formData.age_category === age.value ? '' : age.value })}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                            formData.age_category === age.value
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {age.value}
                        </button>
                      ))}
                    </div>
                    {/* Exact Years Input */}
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="عدد السنوات بالتحديد (إن وجد)..."
                        value={formData.age_years ?? ''}
                        onChange={(e) => setFormData({ ...formData, age_years: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none pl-12"
                      />
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold select-none">سنوات</span>
                    </div>
                  </div>
                </div>

                {/* 2. Tristate Facilities & Features */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700">
                      المميزات والمرافق التفاعلية (Tristate)
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      نقر متتابع: متوفر ✓ ← غير متوفر ✗ ← غير محدد
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {TRISTATE_FEATURES.map(feat => {
                      const state = formData.features?.[feat.key];
                      return (
                        <button
                          key={feat.key}
                          type="button"
                          onClick={() => cycleFeature(feat.key)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-1 select-none ${
                            state === true
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                              : state === false
                              ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate">{feat.label}</span>
                          <span className="shrink-0 flex items-center">
                            {state === true && (
                              <span className="bg-emerald-600 text-white rounded-full p-0.5 text-[10px] font-black leading-none w-4 h-4 flex items-center justify-center">✓</span>
                            )}
                            {state === false && (
                              <span className="bg-rose-600 text-white rounded-full p-0.5 text-[10px] font-black leading-none w-4 h-4 flex items-center justify-center">✕</span>
                            )}
                            {state !== true && state !== false && (
                              <span className="text-slate-300 text-xs font-mono">—</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Furnishing Toggle (Conditional: Only visible if not land) */}
                {!formData.property_type.includes('أرض') && formData.property_type !== 'land' && (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block">
                        حالة التأثيث
                      </label>
                      <span className="text-[10px] text-slate-400 block">
                        هل العقار مؤثث بالكامل وجاهز للسكن؟
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_furnished || false}
                        onChange={(e) => setFormData({ ...formData, is_furnished: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="mr-3 text-xs font-bold text-slate-700">
                        {formData.is_furnished ? 'مؤثث ✨' : 'غير مؤثث'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Pricing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>التسعير وهيكل البيع</span>
              </div>
              {pricePerMeter > 0 && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  سعر المتر: <span className="font-mono">{pricePerMeter.toLocaleString('ar-SA')}</span> ر.س/م²
                </div>
              )}
            </div>

            {/* Interactive Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, price_type: 'سعر محدد', pricing_type: 'fixed' }))}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.pricing_type !== 'bidding' && formData.price_type !== 'على السوم'
                    ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🏷️ للبيع / سعر محدد</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, price_type: 'على السوم', pricing_type: 'bidding' }))}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.pricing_type === 'bidding' || formData.price_type === 'على السوم'
                    ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🤝 على السوم</span>
              </button>
            </div>

            {/* Tab 1: Fixed Price (للبيع / سعر محدد) */}
            {(formData.pricing_type !== 'bidding' && formData.price_type !== 'على السوم') ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    السعر الإجمالي (ريال سعودي) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="مثال: 550000"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) });
                        if (invalidFields.price) setInvalidFields(prev => ({ ...prev, price: false }));
                      }}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none pl-12 transition-all ${
                        invalidFields.price
                          ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 select-none">ر.س</span>
                  </div>
                </div>

                {/* Toggle: قابل للتفاوض */}
                <div className="flex flex-col justify-end">
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, is_negotiable: !prev.is_negotiable }))}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      formData.is_negotiable
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">قابل للتفاوض؟</span>
                      <span className="text-[10px] text-slate-500">هل يقبل المالك التفاوض في السعر؟</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center ${formData.is_negotiable ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Bidding (على السوم) */
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status: ما سيم بعد vs وصلت سومات */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      حالة السوم <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, has_no_bids: true, last_bid: '' }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          formData.has_no_bids !== false
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ما سيم بعد
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, has_no_bids: false }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          formData.has_no_bids === false
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        وصلت سومات
                      </button>
                    </div>
                  </div>

                  {/* آخر سومة إذا اختار وصلت سومات */}
                  {formData.has_no_bids === false && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">
                        آخر سومة وصلت (ريال) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          placeholder="مثال: 450000"
                          value={formData.last_bid ?? ''}
                          onChange={(e) => {
                            setFormData({ ...formData, last_bid: e.target.value === '' ? '' : Number(e.target.value) });
                            if (invalidFields.last_bid) setInvalidFields(prev => ({ ...prev, last_bid: false }));
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none pl-12 transition-all ${
                            invalidFields.last_bid
                              ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                              : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 select-none">ر.س</span>
                      </div>
                    </div>
                  )}

                  {/* الحد المطلوب إن وجد */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      الحد المطلوب (إن وجد - اختياري)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        placeholder="مثال: 500000 (إذا رغب المالك بحد)"
                        value={formData.asking_price ?? ''}
                        onChange={(e) => setFormData({ ...formData, asking_price: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none pl-12"
                      />
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 select-none">ر.س</span>
                    </div>
                  </div>

                  {/* Toggle: يقبل التفاوض على السوم */}
                  <div className="flex flex-col justify-end">
                    <div
                      onClick={() => setFormData(prev => ({ ...prev, is_negotiable: !prev.is_negotiable }))}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        formData.is_negotiable
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">يقبل التفاوض على السوم؟</span>
                        <span className="text-[10px] text-slate-500">هل المالك مرن وقابل للتفاوض؟</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center ${formData.is_negotiable ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Price Outlier / Typo Warning Banner (Requirement 3) */}
            {isPriceOutlier && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">هل أنت متأكد من السعر المدخل؟ يبدو غير متوافق مع متوسط الأسعار المعتادة لهذا الحي.</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {formData.category === 'بيع'
                        ? `سعر المتر المحسوب هو (${pricePerMeter.toLocaleString('ar-SA')} ر.س/م²)، وهو يقع خارج النطاق المعتاد (500 - 15,000 ريال/م²).`
                        : `سعر الإيجار السنوي (${effectivePrice.toLocaleString('ar-SA')} ر.س) منخفض جداً لشقة مستقلة.`}
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 bg-amber-100/90 hover:bg-amber-200/80 px-3.5 py-2 rounded-xl cursor-pointer border border-amber-300 shrink-0 text-xs font-bold select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmedPriceOutlier}
                    onChange={(e) => setConfirmedPriceOutlier(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-400"
                  />
                  <span>أؤكد صحة السعر المدخل</span>
                </label>
              </div>
            )}
          </div>

          {/* Section 6: Saudi Real Estate Compliance (الهيئة العامة للعقار) */}
          <div className="space-y-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>البيانات والتراخيص النظامية (الهيئة العامة للعقار)</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                امتثال الهيئة العامة للعقار 🇸🇦
              </span>
            </div>

            {/* 1. صفة المعلن (advertiser_relationship) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                صفة المعلن <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'broker', label: 'وسيط ومسوق معتمد', desc: 'مكتب / مسوق برخصة فال' },
                  { id: 'owner', label: 'مالك العقار', desc: 'المالك المباشر للعقار' },
                  { id: 'agent', label: 'وكيل شرعي', desc: 'وكيل معتمد بصك وكالة' },
                ].map((rel) => {
                  const isSelected = (formData.advertiser_relationship || 'broker') === rel.id;
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, advertiser_relationship: rel.id as any })}
                      className={`flex flex-col text-right p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600/10 text-emerald-950 font-bold shadow-sm ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{rel.label}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">{rel.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Licenses & Address Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {/* رقم ترخيص الإعلان (إلزامي لجميع العقارات) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم ترخيص الإعلان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: 7200012345"
                  value={formData.ad_license_number}
                  onChange={(e) => {
                    setFormData({ ...formData, ad_license_number: e.target.value });
                    if (invalidFields.ad_license_number) setInvalidFields(prev => ({ ...prev, ad_license_number: false }));
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold outline-none transition-all ${
                    invalidFields.ad_license_number
                      ? 'input-error border-2 border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900'
                      : 'bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">رقم ترخيص الإعلان الصادر من الهيئة</span>
              </div>


              {/* العنوان الوطني المختصر */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  العنوان الوطني المختصر
                </label>
                <input
                  type="text"
                  placeholder="مثال: RRHA4521"
                  value={formData.national_address_code || ''}
                  onChange={(e) => setFormData({ ...formData, national_address_code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">الرمز المختصر المكون من 4 أحرف و4 أرقام</span>
              </div>

              {/* رقم الصك */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الصك الإلكتروني (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: 310105001234"
                  value={formData.deed_number || ''}
                  onChange={(e) => setFormData({ ...formData, deed_number: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all"
                  dir="ltr"
                />
              </div>

              {/* رقم رخصة البناء */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم رخصة البناء (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: 1445/1234"
                  value={formData.building_permit_number || ''}
                  onChange={(e) => setFormData({ ...formData, building_permit_number: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold outline-none bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            {/* حالة الرهن والقيود */}
            <div className="pt-2 border-t border-emerald-200/60">
              <label className="block text-xs font-bold text-slate-700 mb-2.5">
                حالة الرهن والقيود والحقوق والالتزامات
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Is Mortgaged */}
                <div
                  onClick={() => setFormData({ ...formData, is_mortgaged: !formData.is_mortgaged })}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    formData.is_mortgaged
                      ? 'border-amber-400 bg-amber-50/90 text-amber-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">هل العقار مرهون لبنك أو جهة تمويلية؟</span>
                    <span className="text-[10px] text-slate-500">
                      {formData.is_mortgaged ? '⚠️ نعم، يوجد رهن تمويلي مسجل' : '✅ لا، العقار حر وغير مرهون'}
                    </span>
                  </div>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      formData.is_mortgaged ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </div>
                </div>

                {/* Has Restrictions */}
                <div
                  onClick={() => setFormData({ ...formData, has_restrictions: !formData.has_restrictions })}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    formData.has_restrictions
                      ? 'border-amber-400 bg-amber-50/90 text-amber-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">هل توجد أي قيود أو حقوق والتزامات على الصك؟</span>
                    <span className="text-[10px] text-slate-500">
                      {formData.has_restrictions ? '⚠️ نعم، توجد قيود أو التزامات مسجلة' : '✅ لا، لا توجد قيود على الصك'}
                    </span>
                  </div>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      formData.has_restrictions ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Media & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-800 font-bold text-base">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <span>الصور والموقع والوصف</span>
            </div>

            {/* Mapbox Snapping & Auto-Fill (Requirement 4) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>تحديد موقع العقار على الخريطة (سحب وإفلات الدبوس)</span>
                </label>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  تحديد تلقائي للحي والمدينة والمخطط 🎯
                </span>
              </div>

              {/* Mapbox container */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 h-64 w-full">
                <div ref={mapContainerRef} className="w-full h-full" />
                
                {/* Overlay status badge */}
                {geoSnappingStatus && (
                  <div className="absolute bottom-3 right-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-emerald-200 shadow-md text-xs font-bold text-emerald-800 flex items-center justify-between z-10">
                    <span>{geoSnappingStatus}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formData.latitude && formData.longitude ? `${Number(formData.latitude).toFixed(4)}, ${Number(formData.longitude).toFixed(4)}` : ''}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                💡 انقر على أي موقع في الخريطة أو اسحب الدبوس الأخضر، وسيتعرف النظام فوراً على الحي والمدينة ورقم القطعة والمخطط.
              </p>
            </div>

            {/* Google Maps URL */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                رابط موقع العقار (Google Maps)
              </label>
              <input
                type="url"
                placeholder="مثال: https://maps.app.goo.gl/... أو إحداثيات الموقع"
                value={formData.location_url || ''}
                onChange={(e) => handleLocationUrlChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                الوصف والملاحظات الإضافية
              </label>
              <textarea
                rows={3}
                placeholder="اكتب مواصفات وتفاصيل إضافية تفيد المشتري أو المستأجر..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            {/* Images Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                صور العقار (بحد أقصى 8 صور - ضغط WebP تلقائي سريع)
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                    <img src={img} alt={`عقار ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {formData.images.length < 8 && (
                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-emerald-50/50 transition-colors aspect-video">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-[11px] font-bold text-slate-500">
                      {compressing ? 'جاري الضغط...' : 'إضافة صورة'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={compressing}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || compressing}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span>جاري الحفظ وإتاحة العقار...</span>
              ) : (
                <span>حفظ العقار وإتاحته للعملاء فوراً 🚀</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
