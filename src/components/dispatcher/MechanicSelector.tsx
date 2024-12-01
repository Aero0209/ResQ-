import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FaUser, FaStar, FaMapMarkerAlt } from 'react-icons/fa';

interface MechanicSelectorProps {
  onSelect: (mechanicId: string) => void;
  onCancel: () => void;
  requestLocation: {
    lat: number;
    lng: number;
  };
}

interface Mechanic {
  id: string;
  displayName: string;
  phoneNumber: string;
  rating: number;
  available: boolean;
  lastLocation?: {
    lat: number;
    lng: number;
  };
  distance?: number;
}

const MechanicSelector: React.FC<MechanicSelectorProps> = ({
  onSelect,
  onCancel,
  requestLocation
}) => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const mechanicsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'mechanic'),
          where('available', '==', true)
        );

        const snapshot = await getDocs(mechanicsQuery);
        const mechanicsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || 'Sans nom',
            phoneNumber: data.phoneNumber || '',
            rating: data.rating || 0,
            available: data.available || false,
            lastLocation: data.lastLocation,
            distance: calculateDistance(
              requestLocation,
              data.lastLocation || requestLocation
            )
          } as Mechanic;
        });

        // Trier les mécaniciens par distance
        mechanicsData.sort((a: any, b: any) => a.distance - b.distance);
        setMechanics(mechanicsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des mécaniciens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMechanics();
  }, [requestLocation]);

  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);
    const lat1 = toRad(point1.lat);
    const lat2 = toRad(point2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Sélectionner un mécanicien</h3>
      
      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {mechanics.map((mechanic) => (
          <div
            key={mechanic.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              selectedMechanicId === mechanic.id
                ? 'border-accent-500 bg-accent-50'
                : 'border-gray-200 hover:border-accent-300'
            }`}
            onClick={() => setSelectedMechanicId(mechanic.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FaUser className="w-5 h-5 text-accent-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">{mechanic.displayName}</p>
                  <p className="text-sm text-yellow-500">{renderStars(mechanic.rating)}</p>
                </div>
              </div>
              {mechanic.lastLocation && (
                <div className="flex items-center text-sm text-gray-500">
                  <FaMapMarkerAlt className="w-4 h-4 mr-1" />
                  <span>{formatDistance((mechanic as any).distance)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {mechanics.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Aucun mécanicien disponible
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={() => selectedMechanicId && onSelect(selectedMechanicId)}
          disabled={!selectedMechanicId}
          className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
        >
          Assigner
        </button>
      </div>
    </div>
  );
};

export default MechanicSelector; 