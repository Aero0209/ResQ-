import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCheckCircle, FaMapMarkerAlt, FaCar, FaTools, FaPhoneAlt, FaUser, FaTimes, FaClock } from 'react-icons/fa';
import LocationMap from '../map/LocationMap';
import { db } from '@/config/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { GoogleMap, Marker, Circle, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { RequestStatus } from '@/types/auth';
import { playNotificationSound } from '@/utils/sound';
import { GOOGLE_MAPS_LIBRARIES, DEFAULT_MAP_OPTIONS } from '@/config/maps';

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
  status: RequestStatus;
  setRequestStatus: (status: RequestStatus) => void;
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
  setRequestStatus,
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
  const [geoStatus, setGeoStatus] = useState<'idle' | 'trying' | 'error' | 'success'>('idle');

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
        
        // Mettre à jour le statut
        if (data.status !== status) {
          setRequestStatus(data.status as RequestStatus);
        }
        
        // Si la demande a un mécanicien assigné ou acceptée
        if (data.mechanicId) {
          try {
            const mechanicRef = doc(db, 'users', data.mechanicId);
            const mechanicDoc = await getDoc(mechanicRef);
            
            if (mechanicDoc.exists()) {
              const mechanicData = mechanicDoc.data();
              // Stocker les informations de base même si on ne peut pas accéder au profil complet
              setMechanicInfo({
                name: data.mechanicName || mechanicData.displayName || 'Mécanicien',
                phone: data.mechanicPhone || mechanicData.phoneNumber || 'Non disponible',
                rating: mechanicData.rating || 4.5,
                estimatedArrival: data.estimatedArrival || '15-20 minutes'
              });

              // Notifications
              if (data.status === 'accepted' && status !== 'accepted') {
                playNotificationSound();
                toast.success('Le mécanicien a accepté votre demande !');
              } else if (data.status === 'assigned' && status !== 'assigned') {
                playNotificationSound();
                toast.success('Un mécanicien vous a été assigné !');
              }
            } else {
              // Si on ne peut pas accéder au profil du mécanicien, utiliser les données de base
              setMechanicInfo({
                name: data.mechanicName || 'Mécanicien',
                phone: data.mechanicPhone || 'Non disponible',
                rating: 4.5,
                estimatedArrival: data.estimatedArrival || '15-20 minutes'
              });
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des infos du mécanicien:', error);
            // Utiliser les informations de base stockées dans la demande
            setMechanicInfo({
              name: data.mechanicName || 'Mécanicien',
              phone: data.mechanicPhone || 'Non disponible',
              rating: 4.5,
              estimatedArrival: data.estimatedArrival || '15-20 minutes'
            });
          }
        }

        // Mettre à jour la position du mécanicien si disponible
        if (data.mechanicLocation) {
          setMechanicLocation(data.mechanicLocation);
        }
      }
    }, (error) => {
      console.error('Erreur lors de l\'écoute des mises à jour:', error);
      toast.error('Erreur lors de la mise à jour des informations');
    });

    return () => unsubscribe();
  }, [requestId, status]);

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

  // Gérer le suivi de la position actuelle
  useEffect(() => {
    if (!isLoaded || geoErrorCount >= MAX_RETRY_ATTEMPTS) return;

    setGeoStatus('trying');
    let retryTimeout: NodeJS.Timeout;
    let watchId: number | null = null;

    const getPosition = () => {
      // D'abord essayer d'obtenir une position unique
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Si on obtient une position, on la définit
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoStatus('success');
          setGeoErrorCount(0);

          // Puis on démarre le suivi continu
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              setCurrentLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
              setGeoStatus('success');
            },
            (error) => {
              console.warn('Erreur de suivi:', error);
              // Ne pas afficher d'erreur ici car on a déjà une position
            },
            {
              enableHighAccuracy: true,
              maximumAge: 10000,
              timeout: 10000
            }
          );
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          setGeoStatus('error');
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error('Veuillez autoriser l\'accès à votre position');
              break;
            case error.POSITION_UNAVAILABLE:
              // Réessayer avec des paramètres moins stricts
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setCurrentLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  });
                  setGeoStatus('success');
                  setGeoErrorCount(0);
                },
                () => {
                  toast.error('Position indisponible. Vérifiez que votre GPS est activé');
                  setGeoErrorCount(prev => prev + 1);
                },
                {
                  enableHighAccuracy: false, // Essayer sans haute précision
                  maximumAge: 30000,        // Accepter des positions plus anciennes
                  timeout: 20000            // Donner plus de temps
                }
              );
              break;
            case error.TIMEOUT:
              setGeoErrorCount(prev => {
                const newCount = prev + 1;
                if (newCount < MAX_RETRY_ATTEMPTS) {
                  retryTimeout = setTimeout(getPosition, 2000);
                  toast.error(`Nouvelle tentative de localisation (${newCount}/${MAX_RETRY_ATTEMPTS})`);
                } else {
                  toast.error('Impossible d\'obtenir votre position. Veuillez réessayer plus tard.');
                }
                return newCount;
              });
              break;
            default:
              toast.error('Erreur de géolocalisation');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000
        }
      );
    };

    getPosition();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [isLoaded, geoErrorCount]);

  // Afficher un message si la géolocalisation est en cours
  const renderGeoStatus = () => {
    if (geoStatus === 'trying') {
      return (
        <div className="absolute top-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Localisation en cours...</span>
          </div>
        </div>
      );
    }
    if (geoStatus === 'error') {
      return (
        <div className="absolute top-2 left-2 bg-red-500/50 text-white px-3 py-1 rounded-full text-sm">
          Erreur de localisation
        </div>
      );
    }
    return null;
  };

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

  const renderStatusMessage = () => {
    switch (status) {
      case 'pending':
        return (
          <>
            <FaSpinner className="w-12 h-12 text-primary-600 animate-spin" />
            <h3 className="text-xl font-semibold text-white">
              Recherche d'un dépanneur...
            </h3>
            <p className="text-gray-400">
              Temps d'attente: {formatTime(elapsedTime)}
            </p>
          </>
        );

      case 'assigned':
        return (
          <>
            <FaTools className="w-12 h-12 text-accent-500" />
            <h3 className="text-xl font-semibold text-white">
              Un mécanicien vous a été assigné !
            </h3>
            {mechanicInfo && (
              <div className="text-gray-400">
                <p className="font-medium text-lg mb-2">En attente de confirmation...</p>
                <p>Nom : {mechanicInfo.name}</p>
                <p>Contact : {mechanicInfo.phone}</p>
                <p>Note : {renderStars(mechanicInfo.rating)}</p>
                <button
                  onClick={() => window.location.href = `tel:${mechanicInfo.phone}`}
                  className="mt-4 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600"
                >
                  Appeler le mécanicien
                </button>
              </div>
            )}
          </>
        );

      case 'accepted':
        return (
          <>
            <FaCheckCircle className="w-12 h-12 text-green-500" />
            <h3 className="text-xl font-semibold text-white">
              Le mécanicien a accepté votre demande !
            </h3>
            <p className="text-gray-400 mt-2">
              Votre dépanneur est en route. Vous pouvez suivre sa position sur la carte.
            </p>
          </>
        );

      case 'completed':
        return (
          <>
            <FaCheckCircle className="w-12 h-12 text-green-500" />
            <h3 className="text-xl font-semibold text-white">
              Intervention terminée
            </h3>
            <p className="text-gray-400">
              Merci d'avoir utilisé nos services !
            </p>
          </>
        );

      case 'cancelled':
        return (
          <>
            <FaTimes className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-semibold text-white">
              Demande annulée
            </h3>
          </>
        );

      case 'rejected':
        return (
          <>
            <FaTimes className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-semibold text-white">
              Demande refusée
            </h3>
            <p className="text-gray-400">
              Nous sommes désolés, votre demande a été refusée.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  // Modifier la partie du marqueur du mécanicien
  const getMechanicMarkerIcon = (mechanicLoc: { lat: number; lng: number }) => {
    if (!mechanicLoc || !location) return {};

    try {
      const rotation = google.maps.geometry?.spherical
        ? google.maps.geometry.spherical.computeHeading(
            new google.maps.LatLng(mechanicLoc.lat, mechanicLoc.lng),
            new google.maps.LatLng(location.lat, location.lng)
          )
        : 0;

      return {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        scale: 7,
        rotation
      };
    } catch (error) {
      console.warn('Erreur lors du calcul de la rotation:', error);
      return {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        scale: 7,
        rotation: 0
      };
    }
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
      {/* Status Section avec un style amélioré */}
      <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gray-800 rounded-lg shadow-lg">
        {renderStatusMessage()}
      </div>

      {/* Map Section avec des labels améliorés */}
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="h-[400px] relative">
          {renderGeoStatus()}
          <GoogleMap
            mapContainerStyle={mapStyles}
            center={mechanicLocation || location}
            zoom={13}
            options={{
              ...DEFAULT_MAP_OPTIONS,
              zoomControl: true,
              mapTypeControl: false,
              scaleControl: true,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: true
            }}
          >
            {/* Client Marker */}
            <Marker
              position={location}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FF4B4B',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 7
              }}
              label={{
                text: 'Ma position',
                className: 'map-marker-label bg-red-500 text-white px-2 py-1 rounded-full text-xs',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            />

            {/* Mechanic Marker avec une meilleure visibilité */}
            {mechanicLocation && (status === 'assigned' || status === 'accepted') && (
              <Marker
                position={mechanicLocation}
                icon={{
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  fillColor: '#10B981',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                  scale: 7,
                  rotation: google.maps.geometry?.spherical
                    ? google.maps.geometry.spherical.computeHeading(
                        new google.maps.LatLng(mechanicLocation.lat, mechanicLocation.lng),
                        new google.maps.LatLng(location.lat, location.lng)
                      )
                    : 0
                }}
                label={{
                  text: 'Dépanneur',
                  className: 'map-marker-label bg-green-500 text-white px-2 py-1 rounded-full text-xs',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Directions avec un style amélioré */}
            {directions && (status === 'assigned' || status === 'accepted') && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#4F46E5',
                    strokeWeight: 5,
                    strokeOpacity: 0.8
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Route Info avec un meilleur design */}
        {routeInfo && (status === 'assigned' || status === 'accepted') && (
          <div className="p-6 bg-gray-900 text-white border-t border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FaMapMarkerAlt className="text-accent-500" />
                <span className="text-gray-400">Distance:</span>
                <span className="font-semibold text-lg">{routeInfo.distance}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaClock className="text-accent-500" />
                <span className="text-gray-400">Temps estimé:</span>
                <span className="font-semibold text-lg">{routeInfo.duration}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mechanic Info Section avec un design amélioré */}
      {status === 'accepted' && mechanicInfo && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <h4 className="text-xl font-semibold text-white">Votre dépanneur</h4>
            <div className="text-yellow-500 text-lg">{renderStars(mechanicInfo.rating)}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <FaUser className="w-5 h-5 text-accent-500" />
                <div>
                  <p className="font-medium text-lg">{mechanicInfo.name}</p>
                  <p className="text-sm text-gray-400">Professionnel certifié</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-300">
                <FaClock className="w-5 h-5 text-accent-500" />
                <div>
                  <p className="font-medium">Arrivée estimée</p>
                  <p className="text-accent-500">{mechanicInfo.estimatedArrival}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <FaPhoneAlt className="w-5 h-5 text-accent-500" />
                <div>
                  <p className="font-medium">Contact</p>
                  <p className="text-gray-400">{mechanicInfo.phone}</p>
                </div>
              </div>

              <button
                onClick={() => window.location.href = `tel:${mechanicInfo.phone}`}
                className="w-full bg-accent-500 text-white py-3 rounded-lg hover:bg-accent-600 transition-colors flex items-center justify-center space-x-2"
              >
                <FaPhoneAlt />
                <span>Appeler le dépanneur</span>
              </button>
            </div>
          </div>
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

      {/* Actions Section */}
      <div className="flex justify-center">
        {(status === 'pending' || status === 'assigned') && (
          <button
            onClick={handleCancelRequest}
            disabled={isCancelling}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isCancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Annulation...</span>
              </>
            ) : (
              <>
                <FaTimes />
                <span>Annuler la demande</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingScreen; 