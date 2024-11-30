import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCheckCircle, FaMapMarkerAlt, FaCar, FaTools, FaPhoneAlt, FaUser } from 'react-icons/fa';
import LocationMap from '../map/LocationMap';
import { db } from '@/config/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { GoogleMap, Marker } from '@react-google-maps/api';

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
  requestId?: string;
  status: string;
  isLoaded: boolean;
}

interface MechanicInfo {
  name: string;
  phone: string;
  rating: number;
  estimatedArrival: string;
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({
  location,
  vehicleData,
  breakdownData,
  contactData,
  requestId,
  status,
  isLoaded
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [mechanicInfo, setMechanicInfo] = useState<MechanicInfo | null>(null);
  const [mechanicLocation, setMechanicLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Écouter les mises à jour de la demande et de la position du mécanicien
  useEffect(() => {
    if (!requestId) return;

    const requestRef = doc(db, 'helpRequests', requestId);
    const unsubscribe = onSnapshot(requestRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.mechanicId && data.status === 'accepted') {
          try {
            const mechanicRef = doc(db, 'users', data.mechanicId);
            const mechanicDoc = await getDoc(mechanicRef);
            
            if (mechanicDoc.exists()) {
              const mechanicData = mechanicDoc.data();
              setMechanicInfo({
                name: data.mechanicName || mechanicData.name || 'Mécanicien',
                phone: data.mechanicPhone || mechanicData.phone || 'Non disponible',
                rating: mechanicData.rating || 4.5,
                estimatedArrival: data.estimatedArrival || '15-20 minutes'
              });
            }

            // Mettre à jour la position du mécanicien
            if (data.mechanicLocation) {
              setMechanicLocation(data.mechanicLocation);
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des infos du mécanicien:', error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [requestId]);

  const handleCancelRequest = async () => {
    if (!requestId || isCancelling) return;

    setIsCancelling(true);
    try {
      const requestRef = doc(db, 'helpRequests', requestId);
      await updateDoc(requestRef, {
        status: 'cancelled',
        updatedAt: Date.now()
      });
      toast.success('Votre demande a été annulée');
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast.error('Erreur lors de l\'annulation de la demande');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Section - Visible when accepted */}
      {status === 'accepted' && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="h-64 relative">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={location}
              zoom={13}
            >
              {/* Client Location Marker */}
              <Marker
                position={location}
                icon={{
                  url: '/icons/client-marker.png',
                  scaledSize: new google.maps.Size(40, 40)
                }}
              />
              {/* Mechanic Location Marker */}
              {mechanicLocation && (
                <Marker
                  position={mechanicLocation}
                  icon={{
                    url: '/icons/mechanic-marker.png',
                    scaledSize: new google.maps.Size(40, 40)
                  }}
                />
              )}
            </GoogleMap>
          </div>
        </div>
      )}

      {/* Status Section */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {status === 'pending' && (
            <FaSpinner className="w-12 h-12 text-primary-600 animate-spin" />
          )}
          {(status === 'accepted' || status === 'completed') && (
            <FaCheckCircle className="w-12 h-12 text-green-500" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {status === 'pending' && 'Recherche d\'un dépanneur...'}
          {status === 'accepted' && 'Demande acceptée !'}
          {status === 'completed' && 'Intervention terminée'}
          {status === 'cancelled' && 'Demande annulée'}
        </h3>
        <p className="text-gray-400">
          {status === 'pending' && `Temps d'attente: ${formatTime(elapsedTime)}`}
          {status === 'accepted' && mechanicInfo && `Un dépanneur arrive dans ${mechanicInfo.estimatedArrival}`}
          {status === 'completed' && 'Merci d\'avoir utilisé nos services'}
          {status === 'cancelled' && 'Votre demande a été annulée'}
        </p>
      </div>

      {/* Mechanic Info Section */}
      {status === 'accepted' && mechanicInfo && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <h4 className="text-white font-medium mb-3">Votre dépanneur :</h4>
          
          <div className="flex items-start space-x-3 text-gray-300">
            <FaUser className="w-5 h-5 mt-1 text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-medium">{mechanicInfo.name}</p>
              <p className="text-sm text-yellow-500">{renderStars(mechanicInfo.rating)}</p>
              <p className="text-sm text-gray-400">Arrivée estimée : {mechanicInfo.estimatedArrival}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-gray-300">
            <FaPhoneAlt className="w-5 h-5 mt-1 text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-medium">Contact</p>
              <p className="text-sm text-gray-400">{mechanicInfo.phone}</p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = `tel:${mechanicInfo.phone}`}
            className="w-full mt-2 bg-accent-500 text-white py-2 rounded-lg hover:bg-accent-600 transition-colors"
          >
            Appeler le dépanneur
          </button>
        </div>
      )}

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

      {/* Cancel Button - Only show when pending or accepted */}
      {(status === 'pending' || status === 'accepted') && (
        <div className="flex justify-center">
          <button
            onClick={handleCancelRequest}
            disabled={isCancelling}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <span>{isCancelling ? 'Annulation...' : 'Annuler la demande'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WaitingScreen; 