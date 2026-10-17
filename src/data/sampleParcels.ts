// Sample GeoJSON parcels for Al-Ahsa and Eastern Province / Riyadh
// Used as default data if Supabase parcels table is empty or pending PostGIS migration

export interface ParcelFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    id: string;
    plan_number: string;
    parcel_number: string;
    area_sqm: number;
    zoning_type: string;
    city: string;
  };
}

export const SAMPLE_PARCELS: { type: 'FeatureCollection'; features: ParcelFeature[] } = {
  type: 'FeatureCollection',
  features: [
    // Al-Ahsa - Al-Mubarraz / Al-Rashidiyah plan 421/4
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5840, 25.3820],
            [49.5855, 25.3820],
            [49.5855, 25.3832],
            [49.5840, 25.3832],
            [49.5840, 25.3820]
          ]
        ]
      },
      properties: {
        id: 'p-101',
        plan_number: '421/4',
        parcel_number: '101',
        area_sqm: 450,
        zoning_type: 'سكني',
        city: 'الأحساء'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5855, 25.3820],
            [49.5870, 25.3820],
            [49.5870, 25.3832],
            [49.5855, 25.3832],
            [49.5855, 25.3820]
          ]
        ]
      },
      properties: {
        id: 'p-102',
        plan_number: '421/4',
        parcel_number: '102',
        area_sqm: 480,
        zoning_type: 'سكني',
        city: 'الأحساء'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5870, 25.3820],
            [49.5885, 25.3820],
            [49.5885, 25.3832],
            [49.5870, 25.3832],
            [49.5870, 25.3820]
          ]
        ]
      },
      properties: {
        id: 'p-103',
        plan_number: '421/4',
        parcel_number: '103',
        area_sqm: 510,
        zoning_type: 'سكني تجاري',
        city: 'الأحساء'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5840, 25.3832],
            [49.5855, 25.3832],
            [49.5855, 25.3845],
            [49.5840, 25.3845],
            [49.5840, 25.3832]
          ]
        ]
      },
      properties: {
        id: 'p-104',
        plan_number: '421/4',
        parcel_number: '104',
        area_sqm: 450,
        zoning_type: 'سكني',
        city: 'الأحساء'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5855, 25.3832],
            [49.5870, 25.3832],
            [49.5870, 25.3845],
            [49.5855, 25.3845],
            [49.5855, 25.3832]
          ]
        ]
      },
      properties: {
        id: 'p-105',
        plan_number: '421/4',
        parcel_number: '105',
        area_sqm: 470,
        zoning_type: 'سكني',
        city: 'الأحساء'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5870, 25.3832],
            [49.5888, 25.3832],
            [49.5888, 25.3845],
            [49.5870, 25.3845],
            [49.5870, 25.3832]
          ]
        ]
      },
      properties: {
        id: 'p-106',
        plan_number: '421/4',
        parcel_number: '106',
        area_sqm: 620,
        zoning_type: 'تجاري',
        city: 'الأحساء'
      }
    },
    // Al-Ahsa - Al-Nayfiyah plan 305/4
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5780, 25.3520],
            [49.5800, 25.3520],
            [49.5800, 25.3535],
            [49.5780, 25.3535],
            [49.5780, 25.3520]
          ]
        ]
      },
      properties: {
        id: 'p-201',
        plan_number: '305/4',
        parcel_number: '201',
        area_sqm: 550,
        zoning_type: 'سكني',
        city: 'الأحساء'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5800, 25.3520],
            [49.5820, 25.3520],
            [49.5820, 25.3535],
            [49.5800, 25.3535],
            [49.5800, 25.3520]
          ]
        ]
      },
      properties: {
        id: 'p-202',
        plan_number: '305/4',
        parcel_number: '202',
        area_sqm: 520,
        zoning_type: 'سكني',
        city: 'الأحساء'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [49.5820, 25.3520],
            [49.5840, 25.3520],
            [49.5840, 25.3535],
            [49.5820, 25.3535],
            [49.5820, 25.3520]
          ]
        ]
      },
      properties: {
        id: 'p-203',
        plan_number: '305/4',
        parcel_number: '203',
        area_sqm: 600,
        zoning_type: 'سكني تجاري',
        city: 'الأحساء'
      }
    },
    // Riyadh - Al-Narjis
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [46.6620, 24.8110],
            [46.6640, 24.8110],
            [46.6640, 24.8125],
            [46.6620, 24.8125],
            [46.6620, 24.8110]
          ]
        ]
      },
      properties: {
        id: 'p-301',
        plan_number: '1240/أ',
        parcel_number: '301',
        area_sqm: 400,
        zoning_type: 'سكني',
        city: 'الرياض'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [46.6640, 24.8110],
            [46.6660, 24.8110],
            [46.6660, 24.8125],
            [46.6640, 24.8125],
            [46.6640, 24.8110]
          ]
        ]
      },
      properties: {
        id: 'p-302',
        plan_number: '1240/أ',
        parcel_number: '302',
        area_sqm: 420,
        zoning_type: 'سكني',
        city: 'الرياض'
      }
    }
  ]
};
