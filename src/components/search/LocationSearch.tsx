import React, { useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface LocationSearchProps {
  onSearch: (location: string) => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onSearch }) => {
  const [location, setLocation] = useState('');

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Ici vous pourriez convertir les coordonnées en adresse avec une API de géocodage
          const coords = `${position.coords.latitude},${position.coords.longitude}`;
          setLocation(coords);
          onSearch(coords);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 border rounded-lg p-3">
        <FaMapMarkerAlt className="text-gray-400" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Votre position"
          className="flex-1 outline-none"
        />
        <button
          onClick={handleLocate}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          Localiser
        </button>
      </div>
    </div>
  );
};

export default LocationSearch; 