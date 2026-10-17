import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../lib/supabaseClient';
import { Layers, MapPin, Eye, Compass, Home, Filter, RefreshCw, ZoomIn, Building, Search, X } from 'lucide-react';
import { SAMPLE_PARCELS } from '../data/sampleParcels';

// Access Token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Initialize RTL plugin only once
if (typeof window !== 'undefined') {
  try {
    if (mapboxgl.getRTLTextPluginStatus() === 'unavailable') {
      mapboxgl.setRTLTextPlugin(
        'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
        (err) => {
          if (err) console.warn('Mapbox RTL text plugin warning:', err);
        },
        true
      );
    }
  } catch (e) {
    console.warn('RTL plugin init notice:', e);
  }
}

// City presets for quick jump
export const CITY_PRESETS = [
  { name: 'الأحساء', coords: [49.586, 25.383] as [number, number], zoom: 12 },
  { name: 'الرياض', coords: [46.6753, 24.7136] as [number, number], zoom: 11 },
  { name: 'جدة', coords: [39.1925, 21.4858] as [number, number], zoom: 11 },
  { name: 'الدمام', coords: [50.1800, 26.3927] as [number, number], zoom: 11 },
  { name: 'الخبر', coords: [50.1971, 26.2172] as [number, number], zoom: 12 }
];

interface MapComponentProps {
  onSelectProperty?: (property: any) => void;
  height?: string;
  initialCity?: string;
}

export default function MapComponent({ onSelectProperty, height = '680px', initialCity = 'الأحساء' }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [parcelsCount, setParcelsCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'بيع' | 'إيجار'>('all');
  const [showParcels, setShowParcels] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [currentZoom, setCurrentZoom] = useState(12);

  // Saudi GIS District states
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedDistrictInfo, setSelectedDistrictInfo] = useState<any>(null);
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  const [districtSearchResults, setDistrictSearchResults] = useState<any[]>([]);
  const [isSearchingDistrict, setIsSearchingDistrict] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  // Raw data references to filter dynamically
  const rawPropertiesRef = useRef<any[]>([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const targetPreset = CITY_PRESETS.find(c => c.name === selectedCity) || CITY_PRESETS[0];

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: targetPreset.coords,
      zoom: targetPreset.zoom,
      attributionControl: true
    });

    // Add navigation and fullscreen controls
    m.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-left');
    m.addControl(new mapboxgl.FullscreenControl(), 'top-left');
    m.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    m.on('zoom', () => {
      setCurrentZoom(Math.round(m.getZoom() * 10) / 10);
    });

    m.on('load', async () => {
      map.current = m;
      await setupLayers(m);
      setLoading(false);
    });

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // 2. Setup GeoJSON Sources and Layers
  const setupLayers = async (m: mapboxgl.Map) => {
    // -------------------------------------------------------------
    // A. Setup Parcels Layer (Polygon Fill, Outline, and Zoomed-in Labels)
    // -------------------------------------------------------------
    let parcelsGeoJSON: any = SAMPLE_PARCELS;
    try {
      const { data: dbParcels, error: pErr } = await supabase
        .from('parcels')
        .select('*')
        .limit(1000);

      if (!pErr && dbParcels && dbParcels.length > 0) {
        parcelsGeoJSON = {
          type: 'FeatureCollection',
          features: dbParcels
            .filter((p: any) => p.geom || p.coordinates)
            .map((p: any) => ({
              type: 'Feature',
              geometry: typeof p.geom === 'string' ? JSON.parse(p.geom) : p.geom,
              properties: {
                id: p.id,
                plan_number: p.plan_number || 'مخطط',
                parcel_number: p.parcel_number || '-',
                area_sqm: p.area_sqm || 0,
                zoning_type: p.zoning_type || 'سكني'
              }
            }))
        };
      }
    } catch {
      // Use sample fallback
    }

    setParcelsCount(parcelsGeoJSON.features.length);

    m.addSource('parcels-source', {
      type: 'geojson',
      data: parcelsGeoJSON
    });

    // Parcels Fill Layer
    m.addLayer({
      id: 'parcels-fill',
      type: 'fill',
      source: 'parcels-source',
      paint: {
        'fill-color': [
          'match',
          ['get', 'zoning_type'],
          'سكني', '#10b981',
          'تجاري', '#3b82f6',
          'سكني تجاري', '#8b5cf6',
          '#059669'
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.5,
          0.22
        ]
      }
    });

    // Parcels Outline Layer
    m.addLayer({
      id: 'parcels-outline',
      type: 'line',
      source: 'parcels-source',
      paint: {
        'line-color': '#047857',
        'line-width': 1.5
      }
    });

    // Parcels Labels (Show Parcel number when zoom >= 14)
    m.addLayer({
      id: 'parcels-labels',
      type: 'symbol',
      source: 'parcels-source',
      minzoom: 14,
      layout: {
        'text-field': ['concat', 'قطعة ', ['get', 'parcel_number']],
        'text-size': 11,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#064e3b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Parcels Click Popup
    m.on('click', 'parcels-fill', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties || {};

      new mapboxgl.Popup({ closeButton: true, className: 'mayyaz-popup' })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: system-ui, sans-serif; direction: rtl; text-align: right; padding: 4px;">
            <div style="font-size: 13px; font-weight: bold; color: #065f46; margin-bottom: 4px;">
              📐 قطعة أرض: رقم ${props.parcel_number}
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.6;">
              <div>• <b>رقم المخطط:</b> ${props.plan_number}</div>
              <div>• <b>المساحة:</b> ${props.area_sqm} م²</div>
              <div>• <b>نوع الاستخدام:</b> <span style="background: #ecfdf5; color: #047857; padding: 1px 6px; border-radius: 6px; font-weight: bold;">${props.zoning_type}</span></div>
            </div>
          </div>
        `)
        .addTo(m);
    });

    m.on('mouseenter', 'parcels-fill', () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', 'parcels-fill', () => {
      m.getCanvas().style.cursor = '';
    });

    // -------------------------------------------------------------
    // B. Setup Selected Saudi District Layer (Polygon Boundary & FitBounds)
    // -------------------------------------------------------------
    m.addSource('selected-district-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // District Polygon Fill
    m.addLayer({
      id: 'selected-district-fill',
      type: 'fill',
      source: 'selected-district-source',
      paint: {
        'fill-color': '#059669',
        'fill-opacity': 0.16
      }
    });

    // District Boundary Outline
    m.addLayer({
      id: 'selected-district-line',
      type: 'line',
      source: 'selected-district-source',
      paint: {
        'line-color': '#047857',
        'line-width': 2.5,
        'line-dasharray': [2, 1]
      }
    });

    // District Center Label
    m.addLayer({
      id: 'selected-district-label',
      type: 'symbol',
      source: 'selected-district-source',
      layout: {
        'text-field': ['get', 'district_label'],
        'text-size': 13,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#064e3b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2.5
      }
    });

    // -------------------------------------------------------------
    // C. Setup Properties Layer (Clustering, Custom Points, and Popups)
    // -------------------------------------------------------------
    await loadPropertiesData(m);
  };

  // 3. Load Properties from Supabase and Apply GeoJSON with Clustering
  const loadPropertiesData = async (m: mapboxgl.Map) => {
    try {
      const { data: properties, error: propErr } = await supabase
        .from('properties')
        .select('*, offices(name, phone)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('status', 'available');

      if (propErr) throw propErr;

      rawPropertiesRef.current = properties || [];
      setPropertiesCount(rawPropertiesRef.current.length);

      const features = (properties || []).map((p) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(p.longitude), Number(p.latitude)]
        },
        properties: {
          id: p.id,
          title: p.title || p.property_type || 'عقار',
          property_type: p.property_type || 'عقار',
          category: p.category || 'إيجار',
          price: Number(p.price) || 0,
          price_formatted: Number(p.price).toLocaleString('ar-SA'),
          rooms: p.rooms || 0,
          area_sqm: p.area_sqm || 0,
          city: p.city || '',
          district: p.district || '',
          ad_license_number: p.ad_license_number || '',
          image: p.images && p.images[0] ? p.images[0] : '',
          office_name: p.offices?.name || '',
          office_phone: p.offices?.phone || ''
        }
      }));

      const geojsonData = {
        type: 'FeatureCollection' as const,
        features
      };

      if (m.getSource('properties-source')) {
        (m.getSource('properties-source') as mapboxgl.GeoJSONSource).setData(geojsonData);
        return;
      }

      m.addSource('properties-source', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster Circles Layer
      m.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#10b981', // emerald for < 10
            10,
            '#3b82f6', // blue for 10-30
            30,
            '#f59e0b'  // amber for 30+
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            10,
            24,
            30,
            30
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Cluster Count Labels
      m.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Unclustered Point Layer (Individual Properties)
      m.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'category'],
            'إيجار', '#10b981',
            'بيع', '#f59e0b',
            '#059669'
          ],
          'circle-radius': 9,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Price Tag Label on Unclustered Points
      m.addLayer({
        id: 'unclustered-label',
        type: 'symbol',
        source: 'properties-source',
        filter: ['!', ['has', 'point_count']],
        minzoom: 12.5,
        layout: {
          'text-field': ['concat', ['get', 'price_formatted'], ' ر.س'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 1.3],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // Click on Cluster to Zoom in
      m.on('click', 'clusters', (e) => {
        const feats = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = feats[0].properties?.cluster_id;
        const source = m.getSource('properties-source') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null || zoom === undefined) return;
          m.easeTo({
            center: (feats[0].geometry as any).coordinates,
            zoom: zoom + 0.5
          });
        });
      });

      // Click on Unclustered Property to Show Rich Popup
      m.on('click', 'unclustered-point', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const p = feat.properties as any;
        const coords = (feat.geometry as any).coordinates.slice();

        const categoryBadge = p.category === 'إيجار'
          ? '<span style="background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: bold;">🔑 للإيجار</span>'
          : '<span style="background: #fffbeb; color: #b45309; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: bold;">🏷️ للبيع</span>';

        const imageHtml = p.image
          ? `<img src="${p.image}" alt="${p.title}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 12px; margin-bottom: 8px;" />`
          : '';

        const cleanPhone = (p.office_phone || '966530703441').replace(/\+/g, '').replace(/\s/g, '');
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('السلام عليكم، أستفسر عن العقار: ' + p.title + ' المعروض في منصة مياز')}`;

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; direction: rtl; text-align: right; width: 230px; padding: 2px;">
            ${imageHtml}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 13px; font-weight: bold; color: #0f172a;">${p.property_type}</span>
              ${categoryBadge}
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #047857; margin-bottom: 4px;">
              💰 ${p.price_formatted} ر.س
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
              📍 ${p.district ? 'حي ' + p.district + '، ' : ''}${p.city}
            </div>
            <div style="font-size: 11px; color: #334155; display: flex; gap: 8px; margin-bottom: 8px;">
              ${p.rooms ? `<span>🛏️ ${p.rooms} غرف</span>` : ''}
              ${p.area_sqm ? `<span>📐 ${p.area_sqm} م²</span>` : ''}
            </div>
            <div style="display: flex; gap: 6px;">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #25d366; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold; padding: 6px 0; border-radius: 8px;">
                💬 واتساب
              </a>
              <button id="popup-detail-btn-${p.id}" style="flex: 1; text-align: center; background: #047857; color: #ffffff; border: none; font-size: 11px; font-weight: bold; padding: 6px 0; border-radius: 8px; cursor: pointer;">
                📋 التفاصيل
              </button>
            </div>
          </div>
        `;

        new mapboxgl.Popup({ closeButton: true, maxWidth: '280px', className: 'mayyaz-popup' })
          .setLngLat(coords)
          .setHTML(popupContent)
          .addTo(m);

        // Bind button click for external detail view
        setTimeout(() => {
          const btn = document.getElementById(`popup-detail-btn-${p.id}`);
          if (btn && onSelectProperty) {
            btn.onclick = () => onSelectProperty(p);
          }
        }, 100);
      });

      m.on('mouseenter', 'clusters', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'clusters', () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'unclustered-point', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'unclustered-point', () => { m.getCanvas().style.cursor = ''; });

    } catch (err) {
      console.error('Error loading properties into Mapbox:', err);
    }
  };

  // 4. Filter Properties by Category
  const applyCategoryFilter = (cat: 'all' | 'بيع' | 'إيجار') => {
    setActiveCategory(cat);
    if (!map.current) return;

    const m = map.current;
    const source = m.getSource('properties-source') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const filtered = rawPropertiesRef.current.filter((p) => {
      if (cat === 'all') return true;
      return p.category === cat;
    });

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: filtered.map((p) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(p.longitude), Number(p.latitude)]
        },
        properties: {
          id: p.id,
          title: p.title || p.property_type || 'عقار',
          property_type: p.property_type || 'عقار',
          category: p.category || 'إيجار',
          price: Number(p.price) || 0,
          price_formatted: Number(p.price).toLocaleString('ar-SA'),
          rooms: p.rooms || 0,
          area_sqm: p.area_sqm || 0,
          city: p.city || '',
          district: p.district || '',
          ad_license_number: p.ad_license_number || '',
          image: p.images && p.images[0] ? p.images[0] : '',
          office_name: p.offices?.name || '',
          office_phone: p.offices?.phone || ''
        }
      }))
    };

    source.setData(geojsonData);
  };

  // 5. Toggle Layers Visibility
  const toggleLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map.current) return;
    const m = map.current;
    if (m.getLayer(layerId)) {
      m.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  };

  // 6. Saudi GIS District FitBounds & Geofencing
  const fitToDistrict = async (cityName: string, districtName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/districts/bounds?city=${encodeURIComponent(cityName)}&district=${encodeURIComponent(districtName)}`);
      const data = await res.json();
      if (!data.ok || !data.bbox) {
        console.warn('District bounds not found:', data);
        return;
      }

      setSelectedDistrict(data.district_name_ar);
      setSelectedDistrictInfo(data);
      setShowDistrictDropdown(false);
      setDistrictSearchQuery(data.district_name_ar);

      const m = map.current;
      if (!m) return;

      // 1. Smooth camera orientation via fitBounds
      const bbox = data.bbox;
      m.fitBounds([
        [bbox[0], bbox[1]], // Southwest [minX, minY]
        [bbox[2], bbox[3]]  // Northeast [maxX, maxY]
      ], {
        padding: 40,
        duration: 1500
      });

      // 2. Render district polygon boundary
      const source = m.getSource('selected-district-source') as mapboxgl.GeoJSONSource;
      if (source && data.geometry) {
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: data.geometry,
              properties: {
                district_label: `حي ${data.district_name_ar} | ${data.city_name_ar}`,
                district_name_ar: data.district_name_ar,
                city_name_ar: data.city_name_ar
              }
            }
          ]
        });
      }
    } catch (err) {
      console.error('Error fitting to district:', err);
    }
  };

  const clearSelectedDistrict = () => {
    setSelectedDistrict(null);
    setSelectedDistrictInfo(null);
    setDistrictSearchQuery('');
    setDistrictSearchResults([]);
    setShowDistrictDropdown(false);
    if (map.current) {
      const source = map.current.getSource('selected-district-source') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  };

  // Debounced district search
  useEffect(() => {
    if (!districtSearchQuery || districtSearchQuery.trim().length < 2) {
      setDistrictSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDistrict(true);
      try {
        const res = await fetch(`${API_URL}/api/districts/search?city=${encodeURIComponent(selectedCity)}&q=${encodeURIComponent(districtSearchQuery.trim())}`);
        const data = await res.json();
        if (data.ok && data.districts) {
          setDistrictSearchResults(data.districts);
          setShowDistrictDropdown(true);
        }
      } catch (err) {
        console.error('District search error:', err);
      } finally {
        setIsSearchingDistrict(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [districtSearchQuery, selectedCity]);

  // 7. Fly to City
  const handleCityJump = (cityPreset: typeof CITY_PRESETS[0]) => {
    setSelectedCity(cityPreset.name);
    clearSelectedDistrict();
    if (!map.current) return;
    map.current.flyTo({
      center: cityPreset.coords,
      zoom: cityPreset.zoom,
      essential: true,
      duration: 1800
    });
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900" style={{ height }}>
      {/* Mapbox Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-3" />
          <p className="text-sm font-bold">جاري تحميل الخريطة التفاعلية والطبقات الجيومكانية...</p>
        </div>
      )}

      {/* Floating Control Panel (Top Right - RTL) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        
        {/* Main Controls Card */}
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-100 pointer-events-auto">
          
          {/* Header & Stats */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-800">مَيَّاز | الخريطة التفاعلية</h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {propertiesCount} عقار متاح
            </span>
          </div>

          {/* Quick City Presets */}
          <div className="mb-3">
            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">الانتقال السريع للمدينة:</label>
            <div className="flex flex-wrap gap-1">
              {CITY_PRESETS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleCityJump(c)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    selectedCity === c.name
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Saudi GIS District Selector & Search */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400">البحث بالحي (Saudi GIS Bounds):</label>
              {selectedDistrict && (
                <button
                  onClick={clearSelectedDistrict}
                  className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5 font-bold transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>إلغاء التحديد</span>
                </button>
              )}
            </div>

            <div className="relative">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                <Search className="w-3.5 h-3.5 text-slate-400 ml-1.5 flex-shrink-0" />
                <input
                  type="text"
                  value={districtSearchQuery}
                  onChange={(e) => {
                    setDistrictSearchQuery(e.target.value);
                    if (!showDistrictDropdown) setShowDistrictDropdown(true);
                  }}
                  onFocus={() => {
                    if (districtSearchResults.length > 0) setShowDistrictDropdown(true);
                  }}
                  placeholder={`ابحث عن حي في ${selectedCity}...`}
                  className="bg-transparent text-xs w-full text-slate-800 focus:outline-none placeholder:text-slate-400 font-medium"
                />
                {isSearchingDistrict && (
                  <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mr-1" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showDistrictDropdown && districtSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto z-30">
                  {districtSearchResults.map((dist, idx) => (
                    <button
                      key={`${dist.city_name_ar}-${dist.district_name_ar}-${idx}`}
                      onClick={() => fitToDistrict(dist.city_name_ar, dist.district_name_ar)}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-emerald-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-bold text-slate-800">حي {dist.district_name_ar}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{dist.city_name_ar}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active District Banner */}
            {selectedDistrictInfo && (
              <div className="mt-2 bg-emerald-50 border border-emerald-200/80 rounded-xl p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-bold text-emerald-900">
                    حي {selectedDistrictInfo.district_name_ar}
                  </span>
                  <span className="text-[10px] text-emerald-600">({selectedDistrictInfo.city_name_ar})</span>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                  نطاق GIS 📐
                </span>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="mb-3">
            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">تصفية العقارات:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'بيع', 'إيجار'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => applyCategoryFilter(cat)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat === 'بيع' ? 'للبيع' : 'للإيجار'}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Toggles */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1.5">الطبقات الجيومكانية:</label>
            <div className="space-y-1.5 text-xs font-semibold text-slate-700">
              
              {/* Properties Layer Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>عقارات المنصة (نقاط وتجميع)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showProperties}
                  onChange={(e) => {
                    setShowProperties(e.target.checked);
                    toggleLayerVisibility('clusters', e.target.checked);
                    toggleLayerVisibility('cluster-count', e.target.checked);
                    toggleLayerVisibility('unclustered-point', e.target.checked);
                    toggleLayerVisibility('unclustered-label', e.target.checked);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Parcels Layer Toggle */}
              <label className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>مخططات وقطع الأراضي</span>
                </span>
                <input
                  type="checkbox"
                  checked={showParcels}
                  onChange={(e) => {
                    setShowParcels(e.target.checked);
                    toggleLayerVisibility('parcels-fill', e.target.checked);
                    toggleLayerVisibility('parcels-outline', e.target.checked);
                    toggleLayerVisibility('parcels-labels', e.target.checked);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

            </div>
          </div>

        </div>

        {/* Zoom Hint Notification */}
        {currentZoom < 14 && showParcels && (
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-2 rounded-xl text-[11px] font-medium shadow-md flex items-center gap-2 pointer-events-auto border border-white/10">
            <ZoomIn className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>قرّب الخريطة (Zoom In) لإظهار أرقام قطع الأراضي تلقائياً</span>
          </div>
        )}

      </div>

      {/* Map Legend (Bottom Right - RTL) */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] font-bold text-slate-700 shadow-md border border-slate-100 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>للإيجار</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>للبيع</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-600/30 border border-emerald-700" />
          <span>قطعة أرض</span>
        </div>
      </div>

    </div>
  );
}
