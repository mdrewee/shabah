import * as turf from '@turf/turf';
import { TrajectoryRound, TrajectoryHitCountry } from '../types/trajectoryGame';

export const TRAJECTORY_ROUNDS_FALLBACK: TrajectoryRound[] = [
  { id: 'tr_01', originCountry: 'المملكة العربية السعودية', originCountryEn: 'Saudi Arabia', originIso: 'SAU', originCoords: [46.6753, 24.7136], bearing: 320, lineLengthKm: 8500, description: 'انطلاق من الرياض باتجاه 320° (شمال غرب)' },
  { id: 'tr_02', originCountry: 'الجزائر', originCountryEn: 'Algeria', originIso: 'DZA', originCoords: [3.0588, 36.7538], bearing: 75, lineLengthKm: 11000, description: 'انطلاق من الجزائر باتجاه 75° (شرق - شمال شرق)' },
  { id: 'tr_03', originCountry: 'البرازيل', originCountryEn: 'Brazil', originIso: 'BRA', originCoords: [-47.9292, -15.7801], bearing: 55, lineLengthKm: 9500, description: 'انطلاق من برازيليا باتجاه 55° (شمال شرق)' },
  { id: 'tr_04', originCountry: 'جنوب أفريقيا', originCountryEn: 'South Africa', originIso: 'ZAF', originCoords: [18.4241, -33.9249], bearing: 20, lineLengthKm: 12000, description: 'انطلاق من كيب تاون باتجاه 20° (شمال - شمال شرق)' },
  { id: 'tr_05', originCountry: 'اليابان', originCountryEn: 'Japan', originIso: 'JPN', originCoords: [139.6917, 35.6895], bearing: 265, lineLengthKm: 10500, description: 'انطلاق من طوكيو باتجاه 265° (غرب)' },
  { id: 'tr_06', originCountry: 'مصر', originCountryEn: 'Egypt', originIso: 'EGY', originCoords: [31.2357, 30.0444], bearing: 180, lineLengthKm: 7500, description: 'انطلاق من القاهرة باتجاه 180° (جنوب)' },
  { id: 'tr_07', originCountry: 'إسبانيا', originCountryEn: 'Spain', originIso: 'ESP', originCoords: [-3.7038, 40.4168], bearing: 135, lineLengthKm: 8000, description: 'انطلاق من مدريد باتجاه 135° (جنوب شرق)' },
  { id: 'tr_08', originCountry: 'تركيا', originCountryEn: 'Turkey', originIso: 'TUR', originCoords: [32.8597, 39.9334], bearing: 290, lineLengthKm: 6000, description: 'انطلاق من أنقرة باتجاه 290° (غرب - شمال غرب)' },
  { id: 'tr_09', originCountry: 'المكسيك', originCountryEn: 'Mexico', originIso: 'MEX', originCoords: [-99.1332, 19.4326], bearing: 110, lineLengthKm: 9000, description: 'انطلاق من مكسيكو سيتي باتجاه 110° (شرق - جنوب شرق)' },
  { id: 'tr_10', originCountry: 'أستراليا', originCountryEn: 'Australia', originIso: 'AUS', originCoords: [149.1300, -35.2809], bearing: 315, lineLengthKm: 13000, description: 'انطلاق من كانبرا باتجاه 315° (شمال غرب)' },
  { id: 'tr_11', originCountry: 'كندا', originCountryEn: 'Canada', originIso: 'CAN', originCoords: [-75.6972, 45.4215], bearing: 85, lineLengthKm: 7000, description: 'انطلاق من أوتاوا باتجاه 85° (شرق)' },
  { id: 'tr_12', originCountry: 'الهند', originCountryEn: 'India', originIso: 'IND', originCoords: [77.2090, 28.6139], bearing: 300, lineLengthKm: 8000, description: 'انطلاق من نيودلهي باتجاه 300° (شمال غرب)' },
  { id: 'tr_13', originCountry: 'المغرب', originCountryEn: 'Morocco', originIso: 'MAR', originCoords: [-6.8498, 34.0209], bearing: 160, lineLengthKm: 7000, description: 'انطلاق من الرباط باتجاه 160° (جنوب - جنوب شرق)' },
  { id: 'tr_14', originCountry: 'الأرجنتين', originCountryEn: 'Argentina', originIso: 'ARG', originCoords: [-58.3816, -34.6037], bearing: 40, lineLengthKm: 11000, description: 'انطلاق من بوينس آيرس باتجاه 40° (شمال شرق)' },
  { id: 'tr_15', originCountry: 'إيطاليا', originCountryEn: 'Italy', originIso: 'ITA', originCoords: [12.4964, 41.9028], bearing: 115, lineLengthKm: 7000, description: 'انطلاق من روما باتجاه 115° (جنوب شرق)' },
  { id: 'tr_16', originCountry: 'إندونيسيا', originCountryEn: 'Indonesia', originIso: 'IDN', originCoords: [106.8456, -6.2088], bearing: 300, lineLengthKm: 9000, description: 'انطلاق من جاكرتا باتجاه 300° (شمال غرب)' },
  { id: 'tr_17', originCountry: 'نيجيريا', originCountryEn: 'Nigeria', originIso: 'NGA', originCoords: [7.4951, 9.0579], bearing: 60, lineLengthKm: 6500, description: 'انطلاق من أبوجا باتجاه 60° (شمال شرق)' },
  { id: 'tr_18', originCountry: 'ألمانيا', originCountryEn: 'Germany', originIso: 'DEU', originCoords: [13.4050, 52.5200], bearing: 140, lineLengthKm: 5500, description: 'انطلاق من برلين باتجاه 140° (جنوب شرق)' },
  { id: 'tr_19', originCountry: 'باكستان', originCountryEn: 'Pakistan', originIso: 'PAK', originCoords: [73.0479, 33.6844], bearing: 250, lineLengthKm: 6000, description: 'انطلاق من إسلام آباد باتجاه 250° (غرب - جنوب غرب)' },
  { id: 'tr_20', originCountry: 'الصين', originCountryEn: 'China', originIso: 'CHN', originCoords: [116.4074, 39.9042], bearing: 210, lineLengthKm: 8500, description: 'انطلاق من بكين باتجاه 210° (جنوب - جنوب غرب)' },
  { id: 'tr_21', originCountry: 'فرنسا', originCountryEn: 'France', originIso: 'FRA', originCoords: [2.3522, 48.8566], bearing: 95, lineLengthKm: 8000, description: 'انطلاق من باريس باتجاه 95° (شرق)' },
  { id: 'tr_22', originCountry: 'عمان', originCountryEn: 'Oman', originIso: 'OMN', originCoords: [58.4059, 23.5859], bearing: 285, lineLengthKm: 5000, description: 'انطلاق من مسقط باتجاه 285° (غرب - شمال غرب)' },
  { id: 'tr_23', originCountry: 'النرويج', originCountryEn: 'Norway', originIso: 'NOR', originCoords: [10.7522, 59.9139], bearing: 175, lineLengthKm: 6500, description: 'انطلاق من أوسلو باتجاه 175° (جنوب)' },
  { id: 'tr_24', originCountry: 'تشيلي', originCountryEn: 'Chile', originIso: 'CHL', originCoords: [-70.6693, -33.4489], bearing: 15, lineLengthKm: 8500, description: 'انطلاق من سانتياغو باتجاه 15° (شمال - شمال شرق)' },
  { id: 'tr_25', originCountry: 'كازاخستان', originCountryEn: 'Kazakhstan', originIso: 'KAZ', originCoords: [71.4491, 51.1694], bearing: 220, lineLengthKm: 7000, description: 'انطلاق من أستانا باتجاه 220° (جنوب غرب)' },
];

let cachedWorldGeoJSON: any = null;

export async function fetchWorldGeoJSON(): Promise<any> {
  if (cachedWorldGeoJSON) return cachedWorldGeoJSON;
  try {
    const res = await fetch('/data/world.geojson');
    if (!res.ok) throw new Error('Failed to fetch world.geojson');
    const data = await res.json();
    cachedWorldGeoJSON = data;
    return data;
  } catch (err) {
    console.error('Error loading world.geojson:', err);
    return null;
  }
}

export function generateTrajectoryArc(
  originCoords: [number, number],
  bearing: number,
  distanceKm: number = 14000,
  npoints: number = 300
): any {
  const startPt = turf.point(originCoords);
  const endPt = turf.destination(startPt, distanceKm, bearing, { units: 'kilometers' });
  return turf.greatCircle(startPt, endPt, { npoints });
}

export function calculateHitCountries(
  round: TrajectoryRound,
  worldGeoJSON: any,
  maxDistanceKm: number = 14000
): TrajectoryHitCountry[] {
  if (!worldGeoJSON || !worldGeoJSON.features) return [];

  const startPt = turf.point(round.originCoords);
  const line = generateTrajectoryArc(round.originCoords, round.bearing, maxDistanceKm, 250);
  const hits: TrajectoryHitCountry[] = [];

  for (const feat of worldGeoJSON.features) {
    try {
      const iso3 = feat.properties?.iso3 || feat.properties?.['ISO3166-1-Alpha-3'] || '';
      if (iso3 === round.originIso) continue;

      if (turf.booleanIntersects(line, feat)) {
        const intersect = turf.lineIntersect(line, feat);
        let minDist = Infinity;
        let entryPoint: [number, number] | undefined = undefined;

        if (intersect.features.length > 0) {
          for (const pt of intersect.features) {
            const d = turf.distance(startPt, pt, { units: 'kilometers' });
            if (d < minDist) {
              minDist = d;
              entryPoint = pt.geometry.coordinates as [number, number];
            }
          }
        }

        const nameAr = feat.properties?.nameAr || feat.properties?.name || '';
        const nameEn = feat.properties?.nameEn || feat.properties?.name || '';

        if (nameAr && !hits.some((h) => h.iso3 === iso3 && iso3 !== '')) {
          hits.push({
            iso3,
            nameAr,
            nameEn,
            distanceKm: Math.round(minDist === Infinity ? 0 : minDist),
            entryCoords: entryPoint,
          });
        }
      }
    } catch {
      // Ignore geometry topology anomalies
    }
  }

  hits.sort((a, b) => a.distanceKm - b.distanceKm);
  return hits;
}