import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCheckCircle, FaMapMarkerAlt, FaCar, FaTools, FaPhoneAlt } from 'react-icons/fa';
import LocationMap from '../map/LocationMap';

interface WaitingScreenProps {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleData: {
    type: string;
    brand: string;
    licensePlate: string;
  };
  breakdownData: {
    type: string;
    description: string;
  };
  contactData: {
    phoneNumber: string;
  };
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({
  location,
  vehicleData,
  breakdownData,
  contactData,
}) => {
  const [status, setStatus] = useState<'searching' | 'found' | 'confirmed'>('searching');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Simuler la recherche d'un dépanneur (à remplacer par une vraie logique)
    const searchTimer = setTimeout(() => {
      setStatus('found');
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(searchTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {status === 'searching' && (
            <FaSpinner className="w-12 h-12 text-primary-600 animate-spin" />
          )}
          {status === 'found' && (
            <FaCheckCircle className="w-12 h-12 text-green-500" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {status === 'searching' && 'Recherche d\'un dépanneur...'}
          {status === 'found' && 'Dépanneur trouvé !'}
        </h3>
        <p className="text-gray-400">
          {status === 'searching' && `Temps d'attente: ${formatTime(elapsedTime)}`}
          {status === 'found' && 'Un dépanneur va vous contacter dans quelques instants'}
        </p>
      </div>

      {/* Request Details */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h4 className="text-white font-medium mb-3">Détails de votre demande :</h4>
        
        <div className="flex items-start space-x-3 text-gray-300">
          <FaMapMarkerAlt className="w-5 h-5 mt-1 text-primary-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Adresse</p>
            <p className="text-sm text-gray-400">{location.address}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 text-gray-300">
          <FaCar className="w-5 h-5 mt-1 text-primary-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Véhicule</p>
            <p className="text-sm text-gray-400">
              {vehicleData.brand} - {vehicleData.licensePlate}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 text-gray-300">
          <FaTools className="w-5 h-5 mt-1 text-primary-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Panne</p>
            <p className="text-sm text-gray-400">{breakdownData.description}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 text-gray-300">
          <FaPhoneAlt className="w-5 h-5 mt-1 text-primary-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Contact</p>
            <p className="text-sm text-gray-400">+32 {contactData.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-white mb-2">Position :</p>
        <LocationMap center={{ lat: location.lat, lng: location.lng }} />
      </div>
    </div>
  );
};

export default WaitingScreen; 