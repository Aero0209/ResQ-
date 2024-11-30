import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCheckCircle, FaMapMarkerAlt, FaCar, FaTools, FaPhoneAlt, FaUser } from 'react-icons/fa';
import LocationMap from '../map/LocationMap';
import { db } from '@/config/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { GoogleMap, Marker, Circle, Polyline, DirectionsRenderer } from '@react-google-maps/api';

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

interface RouteInfo {
  distance: string;
  duration: string;
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
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [geoErrorCount, setGeoErrorCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 5;

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
        
        // Si la demande est complétée ou annulée, on arrête d'écouter
        if (data.status === 'completed' || data.status === 'cancelled') {
          unsubscribe();
          return;
        }

        if (data.mechanicId && data.status === 'accepted') {
          try {
            // Mettre à jour les informations de base du mécanicien depuis la demande
            setMechanicInfo({
              name: data.mechanicName || 'Mécanicien',
              phone: data.mechanicPhone || 'Non disponible',
              rating: 4.5,
              estimatedArrival: data.estimatedArrival || '15-20 minutes'
            });

            // Mettre à jour la position du mécanicien
            if (data.mechanicLocation) {
              setMechanicLocation(data.mechanicLocation);
            }

            // Récupérer les informations supplémentaires du mécanicien une seule fois
            if (!mechanicInfo) {
              const mechanicRef = doc(db, 'users', data.mechanicId);
              const mechanicDoc = await getDoc(mechanicRef);
              
              if (mechanicDoc.exists()) {
                const mechanicData = mechanicDoc.data();
                setMechanicInfo(prev => ({
                  ...prev!,
                  rating: mechanicData.rating || prev!.rating,
                  name: prev!.name,
                  phone: prev!.phone,
                  estimatedArrival: prev!.estimatedArrival
                }));
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des infos du mécanicien:', error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [requestId]);

  // Calculer l'itinéraire lorsque la position du mécanicien change
  useEffect(() => {
    if (!mechanicLocation || !isLoaded || status !== 'accepted') return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: mechanicLocation,
        destination: location,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const route = result.routes[0].legs[0];
          setRouteInfo({
            distance: route.distance?.text || '',
            duration: route.duration?.text || ''
          });
        }
      }
    );
  }, [mechanicLocation, location, isLoaded, status]);

  // Suivre la position actuelle
  useEffect(() => {
    if (!isLoaded || geoErrorCount >= MAX_RETRY_ATTEMPTS) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGeoErrorCount(0); // Réinitialiser le compteur d'erreurs en cas de succès
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        setGeoErrorCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRY_ATTEMPTS) {
            toast.error('Impossible d\'obtenir votre position après plusieurs tentatives. Veuillez vérifier vos paramètres de localisation.');
          } else {
            toast.error(`Erreur de localisation (tentative ${newCount}/${MAX_RETRY_ATTEMPTS})`);
          }
          return newCount;
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isLoaded, geoErrorCount]);

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

  // Styles pour la carte
  const mapStyles = {
    height: '400px',
    width: '100%'
  };

  const circleOptions = {
    strokeColor: '#4F46E5',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#4F46E5',
    fillOpacity: 0.35,
    radius: 100 // rayon en mètres
  };

  // Calculer le centre et le zoom de la carte pour montrer les deux positions
  const getMapBounds = () => {
    if (mechanicLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(location);
      bounds.extend(mechanicLocation);
      return bounds;
    }
    return null;
  };

  // Styles pour les marqueurs
  const currentLocationIcon = {
    url: '/icons/current-location.svg',
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20)
  };

  const mechanicMarkerIcon = {
    url: '/icons/mechanic-marker.svg',
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20)
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
      {/* Map Section - Toujours visible */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="h-[400px] relative">
          <GoogleMap
            mapContainerStyle={mapStyles}
            center={currentLocation || location}
            zoom={13}
            options={{
              styles: [
                {
                  featureType: 'all',
                  elementType: 'all',
                  stylers: [
                    { saturation: -100 },
                    { lightness: 0 }
                  ]
                }
              ],
              disableDefaultUI: true,
              zoomControl: true,
              streetViewControl: true,
              fullscreenControl: true
            }}
          >
            {/* Marqueur pour la position initiale */}
            <Marker
              position={location}
              icon={{
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor: '#FF4B4B',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 7,
                rotation: 180
              }}
              label={{
                text: 'Position initiale',
                className: 'map-marker-label',
                color: '#FF4B4B',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            />

            {/* Marqueur pour ma position actuelle */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4F46E5',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                  scale: 7
                }}
                label={{
                  text: 'Ma position',
                  className: 'map-marker-label',
                  color: '#4F46E5',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Marqueur pour le mécanicien */}
            {status === 'accepted' && mechanicLocation && (
              <Marker
                position={mechanicLocation}
                icon={{
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  fillColor: '#10B981',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                  scale: 7
                }}
                label={{
                  text: 'Dépanneur',
                  className: 'map-marker-label',
                  color: '#10B981',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Afficher l'itinéraire */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#4F46E5',
                    strokeWeight: 4
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>
        {/* Informations de route */}
        {routeInfo && status === 'accepted' && (
          <div className="p-4 bg-gray-900 text-white">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-400">Distance:</span>
                <span className="ml-2 font-semibold">{routeInfo.distance}</span>
              </div>
              <div>
                <span className="text-gray-400">Temps estimé:</span>
                <span className="ml-2 font-semibold">{routeInfo.duration}</span>
              </div>
            </div>
          </div>
        )}
      </div>

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