import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toArabicNumber } from '../../../../utils/numberFormat';

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isTarget?: boolean;
  color?: string;
  distanceKm?: number;
  points?: number;
}

interface GuideWorldMapProps {
  interactive?: boolean;
  userPin?: { lat: number; lng: number } | null;
  onPinChange?: (pin: { lat: number; lng: number }) => void;
  targetLandmark?: {
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  } | null;
  markers?: MapMarker[];
  showDistanceLines?: boolean;
  isLocked?: boolean;
  autoCenterOnTarget?: boolean;
  className?: string;
}

/**
 * Photo-Realistic Satellite Map powered by Leaflet & Esri World Imagery + Places
 * Used for TV display, results stage, and mini-map previews with zero API key dependencies.
 */
export const GuideWorldMap: React.FC<GuideWorldMapProps> = ({
  interactive = false,
  userPin = null,
  onPinChange,
  targetLandmark = null,
  markers = [],
  showDistanceLines = false,
  isLocked = false,
  autoCenterOnTarget = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  // Initialize Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: targetLandmark ? [targetLandmark.lat, targetLandmark.lng] : [24.0, 45.0],
      zoom: targetLandmark ? 6 : 3,
      minZoom: 2,
      maxZoom: 17,
      worldCopyJump: true,
      zoomControl: interactive,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: false,
      keyboard: false,
    });

    mapRef.current = map;

    // 1. Photo-Realistic Satellite Imagery (Esri World Imagery)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 17,
        minZoom: 2,
        attribution: 'Tiles &copy; Esri',
      }
    ).addTo(map);

    // 2. Transparent Country Borders and Place Names (Esri Boundaries)
    L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 17,
        minZoom: 2,
      }
    ).addTo(map);

    // Layer group for dynamic markers and lines
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    if (interactive && onPinChange) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isLockedRef.current) return;
        const lat = Number(e.latlng.lat.toFixed(4));
        const lng = Number(e.latlng.lng.toFixed(4));
        onPinChange({ lat, lng });
      });
    }

    // Safety invalidation timer
    const invalidateTimer = setTimeout(() => {
      try {
        if (mapRef.current && containerRef.current) {
          mapRef.current.invalidateSize();
        }
      } catch {}
    }, 250);

    return () => {
      clearTimeout(invalidateTimer);
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch {}
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update Markers, Target Landmark, Distance Lines, and Auto-centering
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const boundsPoints: L.LatLngTuple[] = [];

    // 1. Target Landmark Pin (Glowing Golden Badge)
    if (targetLandmark) {
      const targetIcon = L.divIcon({
        className: 'shabah-target-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
            <div style="padding: 4px 10px; background: #000000; border: 2px solid #F59E0B; border-radius: 9999px; box-shadow: 0 0 16px rgba(245, 158, 11, 0.7); display: flex; align-items: center; gap: 4px; margin-bottom: 4px; white-space: nowrap;">
              <span style="color: #F59E0B; font-size: 11px; font-weight: 900; font-family: sans-serif;">★ ${targetLandmark.name}</span>
            </div>
            <div style="width: 26px; height: 26px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: #F59E0B; border: 2px solid #FFFFFF; box-shadow: 0 0 14px #F59E0B; display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #000000;"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([targetLandmark.lat, targetLandmark.lng], { icon: targetIcon, interactive: false }).addTo(
        layerGroup
      );
      boundsPoints.push([targetLandmark.lat, targetLandmark.lng]);
    }

    // 2. Contestant Pins & Dashed Distance Lines
    markers.forEach((m) => {
      // Disregard unplaced pins at (0, 0)
      const isValidCoord =
        typeof m.lat === 'number' &&
        typeof m.lng === 'number' &&
        !isNaN(m.lat) &&
        !isNaN(m.lng) &&
        (m.lat !== 0 || m.lng !== 0);

      if (!isValidCoord) return;

      const pinColor = m.color || '#38BDF8';
      const markerIcon = L.divIcon({
        className: 'shabah-contestant-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
            <div style="padding: 3px 8px; background: #000000; border: 1.5px solid ${pinColor}; border-radius: 9999px; box-shadow: 0 0 12px ${pinColor}88; display: flex; align-items: center; gap: 4px; margin-bottom: 3px; white-space: nowrap;">
              <span style="color: #FFFFFF; font-size: 10px; font-weight: 800; font-family: sans-serif;">${m.name}</span>
              ${m.points !== undefined ? `<span style="color: #4ADE80; font-size: 10px; font-weight: 900; font-family: sans-serif;">+${toArabicNumber(m.points)}</span>` : ''}
            </div>
            <div style="width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: ${pinColor}; border: 2px solid #FFFFFF; box-shadow: 0 0 10px ${pinColor}; display: flex; align-items: center; justify-content: center;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #000000;"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([m.lat, m.lng], { icon: markerIcon, interactive: false }).addTo(layerGroup);
      boundsPoints.push([m.lat, m.lng]);

      // Draw dashed distance line to target
      if (showDistanceLines && targetLandmark) {
        L.polyline(
          [
            [m.lat, m.lng],
            [targetLandmark.lat, targetLandmark.lng],
          ],
          {
            color: pinColor,
            weight: 2.5,
            opacity: 0.85,
            dashArray: '6, 8',
          }
        ).addTo(layerGroup);
      }
    });

    // 3. User Pin (if in interactive mode)
    if (userPin && (userPin.lat !== 0 || userPin.lng !== 0)) {
      const userIcon = L.divIcon({
        className: 'shabah-user-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: none;">
            <div style="width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: #B56BFF; border: 2px solid #FFFFFF; box-shadow: 0 0 14px #B56BFF; display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #000000;"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([userPin.lat, userPin.lng], { icon: userIcon, interactive: false }).addTo(layerGroup);
      boundsPoints.push([userPin.lat, userPin.lng]);
    }

    // 4. Viewport Alignment & Zoom-Out:
    // When contestant pins are present, smoothly zoom out so all contestants' pins
    // and the target landmark are framed together on screen.
    const hasContestantPins = boundsPoints.length > (targetLandmark ? 1 : 0);

    if (hasContestantPins) {
      const bounds = L.latLngBounds(boundsPoints);
      const timer = setTimeout(() => {
        try {
          if (!mapRef.current) return;
          mapRef.current.invalidateSize();
          mapRef.current.fitBounds(bounds, {
            padding: [90, 90],
            maxZoom: 6,
            animate: true,
            duration: 1.8,
            easeLinearity: 0.25,
          });
        } catch {}
      }, 400);

      return () => clearTimeout(timer);
    } else if (targetLandmark) {
      map.flyTo([targetLandmark.lat, targetLandmark.lng], 6, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [targetLandmark, markers, showDistanceLines, userPin, autoCenterOnTarget]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#000000] ${className}`}>
      <div ref={containerRef} className="w-full h-full" style={{ background: '#000000' }} />
    </div>
  );
};

export default GuideWorldMap;
