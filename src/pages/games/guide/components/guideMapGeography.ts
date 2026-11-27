import L from 'leaflet';
import './guideMapGeography.css';

interface Geography {
  labels: [name: string, lat: number, lng: number, minZoom: number, maxZoom: number][];
  borders: L.LatLngTuple[][];
}

let geography: Promise<Geography> | undefined;

export function addGuideMapGeography(map: L.Map): () => void {
  const labels = L.layerGroup().addTo(map);
  let active = true;
  let redraw: (() => void) | undefined;
  geography ??= fetch('/guide-map-ar.json').then(response => {
    if (!response.ok) throw new Error('Guide geography unavailable');
    return response.json();
  });
  void geography.then(data => {
    if (!active) return;
    L.polyline(data.borders, { color: '#e2e8f0', weight: 1, opacity: 0.55, interactive: false }).addTo(map);
    redraw = () => {
      labels.clearLayers();
      const zoom = map.getZoom();
      const bounds = map.getBounds().pad(0.05);
      const center = map.getCenter().lng;
      const occupied = new Set<string>();
      for (const [name, lat, lng, minZoom, maxZoom] of data.labels) {
        const visibleLng = lng + 360 * Math.round((center - lng) / 360);
        if (zoom < minZoom || zoom > maxZoom || !bounds.contains([lat, visibleLng])) continue;
        const { x, y } = map.latLngToContainerPoint([lat, visibleLng]);
        const cell = `${Math.floor(x / 80)}:${Math.floor(y / 32)}`;
        if (occupied.has(cell)) continue;
        occupied.add(cell);
        const label = document.createElement('span');
        label.dir = 'rtl';
        label.lang = 'ar';
        label.textContent = name;
        labels.addLayer(L.marker([lat, visibleLng], {
          interactive: false, keyboard: false, zIndexOffset: -1000,
          icon: L.divIcon({ className: 'guide-map-label', html: label, iconSize: [0, 0], iconAnchor: [0, 0] }),
        }));
      }
    };
    map.on('moveend zoomend resize', redraw);
    redraw();
  }).catch(() => { geography = undefined; });

  return () => {
    active = false;
    if (redraw) map.off('moveend zoomend resize', redraw);
  };
}
