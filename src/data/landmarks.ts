import { LandmarkItem, LandmarkScope } from '../types/landmarkGame';

/**
 * Calculates geodesic distance between two coordinates using the Haversine formula.
 * Returns integer distance in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const saudiLandmarks: LandmarkItem[] = [
  {
    "id": "sa_01",
    "name": "جبل القارة بالأحساء",
    "lat": 25.4147,
    "lng": 49.6917,
    "scope": "saudi"
  },
  {
    "id": "sa_02",
    "name": "قصر إبراهيم التاريخي",
    "lat": 25.3789,
    "lng": 49.5864,
    "scope": "saudi"
  },
  {
    "id": "sa_03",
    "name": "ميناء العقير التاريخي",
    "lat": 25.6322,
    "lng": 50.2158,
    "scope": "saudi"
  },
  {
    "id": "sa_04",
    "name": "برج المملكة بالرياض",
    "lat": 24.7115,
    "lng": 46.6744,
    "scope": "saudi"
  },
  {
    "id": "sa_05",
    "name": "برج الفيصلية بالرياض",
    "lat": 24.6901,
    "lng": 46.6853,
    "scope": "saudi"
  },
  {
    "id": "sa_06",
    "name": "قصر المصمك",
    "lat": 24.6312,
    "lng": 46.7133,
    "scope": "saudi"
  },
  {
    "id": "sa_07",
    "name": "حي الطريف بالدرعية",
    "lat": 24.7339,
    "lng": 46.5744,
    "scope": "saudi"
  },
  {
    "id": "sa_08",
    "name": "حافة العالم (مطل طويق)",
    "lat": 24.9458,
    "lng": 45.9908,
    "scope": "saudi"
  },
  {
    "id": "sa_09",
    "name": "فوهة بركان الوعبة (حفرة كشب)",
    "lat": 22.9033,
    "lng": 41.1394,
    "scope": "saudi"
  },
  {
    "id": "sa_10",
    "name": "صخرة الفيل بالعلا",
    "lat": 26.6883,
    "lng": 37.9575,
    "scope": "saudi"
  },
  {
    "id": "sa_11",
    "name": "مدائن صالح (الحِجر)",
    "lat": 26.8021,
    "lng": 37.9547,
    "scope": "saudi"
  },
  {
    "id": "sa_12",
    "name": "مسرح مرايا بالعلا",
    "lat": 26.6267,
    "lng": 37.9152,
    "scope": "saudi"
  },
  {
    "id": "sa_13",
    "name": "قرية ذي عين التراثية بالباحة",
    "lat": 19.9297,
    "lng": 41.4428,
    "scope": "saudi"
  },
  {
    "id": "sa_14",
    "name": "قرية رجال ألمع التراثية",
    "lat": 18.2178,
    "lng": 42.1764,
    "scope": "saudi"
  },
  {
    "id": "sa_15",
    "name": "قمة جبل السودة",
    "lat": 18.2678,
    "lng": 42.3686,
    "scope": "saudi"
  },
  {
    "id": "sa_16",
    "name": "نافورة الملك فهد بجدة",
    "lat": 21.5167,
    "lng": 39.1464,
    "scope": "saudi"
  },
  {
    "id": "sa_17",
    "name": "منطقة البلد التاريخية بجدة",
    "lat": 21.4858,
    "lng": 39.1864,
    "scope": "saudi"
  },
  {
    "id": "sa_18",
    "name": "مركز إثراء الثقافي بالظهران",
    "lat": 26.3353,
    "lng": 50.1205,
    "scope": "saudi"
  },
  {
    "id": "sa_19",
    "name": "شاطئ نصف القمر بالشرقية",
    "lat": 26.1558,
    "lng": 50.04,
    "scope": "saudi"
  },
  {
    "id": "sa_20",
    "name": "قلعة مارد بدومة الجندل",
    "lat": 29.8119,
    "lng": 39.8669,
    "scope": "saudi"
  },
  {
    "id": "sa_21",
    "name": "أعمدة الرجاجيل بسكاكا",
    "lat": 29.8089,
    "lng": 40.2175,
    "scope": "saudi"
  },
  {
    "id": "sa_22",
    "name": "قلعة عيرف بحائل",
    "lat": 27.5114,
    "lng": 41.6961,
    "scope": "saudi"
  },
  {
    "id": "sa_23",
    "name": "جبل أحد بالمدينة المنورة",
    "lat": 24.5034,
    "lng": 39.6121,
    "scope": "saudi"
  },
  {
    "id": "sa_24",
    "name": "جبل النور بمكة المكرمة",
    "lat": 21.4578,
    "lng": 39.8592,
    "scope": "saudi"
  },
  {
    "id": "sa_25",
    "name": "جزر فرسان بجازان",
    "lat": 16.7036,
    "lng": 42.1189,
    "scope": "saudi"
  }
];

export const worldLandmarks: LandmarkItem[] = [
  {
    "id": "wo_01",
    "name": "برج إيفل",
    "lat": 48.8584,
    "lng": 2.2945,
    "scope": "world"
  },
  {
    "id": "wo_02",
    "name": "متحف اللوفر",
    "lat": 48.8606,
    "lng": 2.3376,
    "scope": "world"
  },
  {
    "id": "wo_03",
    "name": "الكولوسيوم",
    "lat": 41.8902,
    "lng": 12.4922,
    "scope": "world"
  },
  {
    "id": "wo_04",
    "name": "برج بيزا المائل",
    "lat": 43.723,
    "lng": 10.3966,
    "scope": "world"
  },
  {
    "id": "wo_05",
    "name": "ساعة بيغ بن",
    "lat": 51.5007,
    "lng": -0.1246,
    "scope": "world"
  },
  {
    "id": "wo_06",
    "name": "ستونهنج",
    "lat": 51.1789,
    "lng": -1.8262,
    "scope": "world"
  },
  {
    "id": "wo_07",
    "name": "أهرامات الجيزة",
    "lat": 29.9792,
    "lng": 31.1342,
    "scope": "world"
  },
  {
    "id": "wo_08",
    "name": "مكتبة الإسكندرية",
    "lat": 31.2089,
    "lng": 29.9092,
    "scope": "world"
  },
  {
    "id": "wo_09",
    "name": "مدينة البتراء الأثرية",
    "lat": 30.3285,
    "lng": 35.4444,
    "scope": "world"
  },
  {
    "id": "wo_10",
    "name": "برج خليفة",
    "lat": 25.1972,
    "lng": 55.2744,
    "scope": "world"
  },
  {
    "id": "wo_11",
    "name": "أبراج الكويت",
    "lat": 29.3897,
    "lng": 47.9978,
    "scope": "world"
  },
  {
    "id": "wo_12",
    "name": "تاج محل",
    "lat": 27.1751,
    "lng": 78.0421,
    "scope": "world"
  },
  {
    "id": "wo_13",
    "name": "سور الصين العظيم",
    "lat": 40.4319,
    "lng": 116.5704,
    "scope": "world"
  },
  {
    "id": "wo_14",
    "name": "المدينة المحرمة ببكين",
    "lat": 39.9163,
    "lng": 116.3972,
    "scope": "world"
  },
  {
    "id": "wo_15",
    "name": "قمة جبل فوجي",
    "lat": 35.3606,
    "lng": 138.7274,
    "scope": "world"
  },
  {
    "id": "wo_16",
    "name": "معبد أنغكور وات",
    "lat": 13.4125,
    "lng": 103.867,
    "scope": "world"
  },
  {
    "id": "wo_17",
    "name": "دار أوبرا سيدني",
    "lat": -33.8568,
    "lng": 151.2153,
    "scope": "world"
  },
  {
    "id": "wo_18",
    "name": "تمثال الحرية بنيويورك",
    "lat": 40.6892,
    "lng": -74.0445,
    "scope": "world"
  },
  {
    "id": "wo_19",
    "name": "جسر البوابة الذهبية (سان فرانسيسكو)",
    "lat": 37.8199,
    "lng": -122.4783,
    "scope": "world"
  },
  {
    "id": "wo_20",
    "name": "الأخدود العظيم (غراند كانيون)",
    "lat": 36.1069,
    "lng": -112.1129,
    "scope": "world"
  },
  {
    "id": "wo_21",
    "name": "مدينة ماتشو بيتشو المفقودة",
    "lat": -13.1631,
    "lng": -72.545,
    "scope": "world"
  },
  {
    "id": "wo_22",
    "name": "تمثال المسيح الفادي بريو",
    "lat": -22.9519,
    "lng": -43.2105,
    "scope": "world"
  },
  {
    "id": "wo_23",
    "name": "شلالات إجوازو",
    "lat": -25.6953,
    "lng": -54.4367,
    "scope": "world"
  },
  {
    "id": "wo_24",
    "name": "جامع آيا صوفيا بإسطنبول",
    "lat": 41.0086,
    "lng": 28.9802,
    "scope": "world"
  },
  {
    "id": "wo_25",
    "name": "قصر الحمراء بغرناطة",
    "lat": 37.1773,
    "lng": -3.5898,
    "scope": "world"
  },
  {
    "id": "wo_26",
    "name": "شلالات فيكتوريا",
    "lat": -17.9243,
    "lng": 25.8572,
    "scope": "world"
  }
];

export const allLandmarks: LandmarkItem[] = [...saudiLandmarks, ...worldLandmarks];

export function getLandmarksByScope(scope: LandmarkScope): LandmarkItem[] {
  return scope === 'saudi' ? saudiLandmarks : worldLandmarks;
}
