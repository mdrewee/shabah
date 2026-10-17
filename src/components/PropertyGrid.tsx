import React from 'react';

interface Property {
  id: string;
  title: string;
  property_type: string;
  category: string;
  city: string;
  district: string;
  price: number;
  rooms?: number;
  area_sqm?: number;
  images?: string[];
}

interface Props {
  properties: Property[];
}

const PropertyGrid: React.FC<Props> = ({ properties }) => {
  if (!properties || properties.length === 0) {
    return <p className="text-gray-600">لا توجد عقارات لعرضها.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map((prop) => (
        <div key={prop.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
          <h3 className="font-bold text-lg mb-2">{prop.title}</h3>
          <p className="text-sm mb-1">{prop.property_type} • {prop.category}</p>
          <p className="text-sm mb-1">{prop.city} - {prop.district}</p>
          <p className="text-sm mb-1 font-medium">{prop.price.toLocaleString()} ر.س</p>
          {prop.rooms && <p className="text-sm">عدد الغرف: {prop.rooms}</p>}
          {prop.area_sqm && <p className="text-sm">المساحة: {prop.area_sqm} م²</p>}
          {prop.images && prop.images.length > 0 && (
            <img
              src={prop.images[0]}
              alt={prop.title}
              className="mt-2 w-full h-32 object-cover rounded"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default PropertyGrid;
