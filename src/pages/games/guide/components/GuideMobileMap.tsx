import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GuideMobileMapProps {
  userPin: { lat: number; lng: number } | null;
  onPinChange?: (coords: { lat: number; lng: number }) => void;
  onPinSelect?: (lat: number, lng: number) => void;
  isLocked?: boolean;
  className?: string;
}

// Custom Glowing Purple Shabah Pin
const customPinIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="transform: translate(-50%, -100%);">
           <div style="width: 24px; height: 24px; background: #A855F7; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 14px #A855F7; display: flex; align-items: center; justify-content: center;">
             <div style="width: 8px; height: 8px; background: #000000; border-radius: 50%;"></div>
           </div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

/**
 * Mobile Satellite Map utilizing Leaflet and Esri Imagery.
 * Uses explicit height (62vh) to prevent the zero-height flexbox bug.
 */
export const GuideMobileMap: React.FC<GuideMobileMapProps> = ({
  userPin,
  onPinChange,
  onPinSelect,
  isLocked = false,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  const handleSelect = (lat: number, lng: number) => {
    if (onPinSelect) onPinSelect(lat, lng);
    if (onPinChange) onPinChange({ lat, lng });
  };

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Safety: ensure no lingering Leaflet instance is bound to the DOM node
    if ((container as any)._leaflet_id) {
      try {
        delete (container as any)._leaflet_id;
      } catch {}
    }

    // Initialize Leaflet Map with pitch-black styling
    const map = L.map(container, {
      center: [24.7136, 46.6753], // Centered on Riyadh / Middle East
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      worldCopyJump: true,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // 1. Photo-Realistic Satellite Base Map (Esri World Imagery)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 17,
      minZoom: 2,
      attribution: 'Esri World Imagery',
    }).addTo(map);

    // 2. Transparent Boundaries & Place Labels (Esri World Boundaries and Places)
    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 17,
      minZoom: 2,
    }).addTo(map);

    // Map Click / Tap Event
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isLockedRef.current) return;

      // Haptic Feedback for physical touch sensation
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch {}
      }

      const lat = Number(e.latlng.lat.toFixed(4));
      const lng = Number(e.latlng.lng.toFixed(4));
      handleSelect(lat, lng);
    });

    // Invalidate size once container mounts (unfreezing zero-height rendering)
    const timer1 = setTimeout(() => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      } catch {}
    }, 150);

    const timer2 = setTimeout(() => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      } catch {}
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        }
      } catch {}
      mapInstanceRef.current = null;
      markerRef.current = null;
      if (container) {
        try {
          delete (container as any)._leaflet_id;
        } catch {}
      }
    };
  }, []);

  // Update or render marker when userPin changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (userPin) {
        if (!markerRef.current) {
          markerRef.current = L.marker([userPin.lat, userPin.lng], {
            icon: customPinIcon,
            interactive: false,
          }).addTo(map);
        } else {
          markerRef.current.setLatLng([userPin.lat, userPin.lng]);
        }
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    } catch {}
  }, [userPin]);

  return (
    <div className={`relative w-full h-[62vh] min-h-[360px] rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 ${className}`}>
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%', background: '#09090b' }}
      />
    </div>
  );
};

export default GuideMobileMap;
