import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import Layout from '@/components/layout/Layout';
import MechanicRoute from '@/components/auth/MechanicRoute';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, Libraries } from '@react-google-maps/api';
import { FaPhone, FaComment, FaMapMarkerAlt, FaCar, FaTools } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface RequestDetails {
  id: string;
  userId: string;
  userPhone: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleType: string;
  vehicleBrand: string;
  vehicleLicensePlate: string;
  breakdownType: string;
  description: string;
  status: string;
  mechanicId?: string;
  mechanicLocation?: {
    lat: number;
    lng: number;
  };
  acceptedAt?: number;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

const libraries: Libraries = ['places'];

const center = { lat: 50.8503, lng: 4.3517 }; // Brussels coordinates

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const RequestDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [geoErrorCount, setGeoErrorCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 5;
  const [isProcessing, setIsProcessing] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'trying' | 'error' | 'success'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const RETRY_DELAY = 2000; // 2 secondes

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // Écouter les mises à jour de la demande
  useEffect(() => {
    if (!id || !user || !settings) return;

    const unsubscribe = onSnapshot(doc(db, 'helpRequests', id as string), async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        
        // En mode dispatcher, la demande est automatiquement acceptée
        if (settings.dispatchMode === 'dispatcher' && data.status === 'assigned') {
          await updateDoc(doc.ref, {
            status: 'accepted',
            acceptedAt: Date.now(),
            updatedAt: Date.now()
          });
        }

        const requestData = {
          id: doc.id,
          userId: data.userId,
          userPhone: data.contactData?.phoneNumber || data.userPhone,
          location: {
            lat: data.location.lat,
            lng: data.location.lng,
            address: data.location.address
          },
          vehicleType: data.vehicleData?.type || data.vehicleType,
          vehicleBrand: data.vehicleData?.brand || data.vehicleBrand,
          vehicleLicensePlate: data.vehicleData?.licensePlate || data.vehicleLicensePlate,
          breakdownType: data.breakdownData?.type || data.breakdownType,
          description: data.breakdownData?.description || data.description,
          status: data.status,
          mechanicId: data.mechanicId,
          mechanicLocation: data.mechanicLocation,
          acceptedAt: data.acceptedAt
        };

        setRequest(requestData);
      }
    });

    return () => {
      unsubscribe();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [id, user, settings]);

  // Gérer le suivi de la position actuelle
  useEffect(() => {
    if (!request || !user || !isLoaded || retryCount >= MAX_RETRY_ATTEMPTS) return;

    setGeoStatus('trying');
    let retryTimeout: NodeJS.Timeout;
    let watchId: number;

    const startWatching = () => {
      return navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCurrentLocation(newLocation);
          setGeoStatus('success');
          setRetryCount(0);

          try {
            await updateDoc(doc(db, 'helpRequests', request.id), {
              mechanicLocation: newLocation,
              updatedAt: Date.now()
            });
          } catch (error) {
            console.error('Erreur lors de la mise à jour de la position:', error);
          }
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          setGeoStatus('error');

          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error("Veuillez autoriser l'accès à votre position pour continuer");
              break;

            case error.POSITION_UNAVAILABLE:
              toast.error('Position indisponible. Vérifiez votre connexion GPS');
              break;

            case error.TIMEOUT:
              setRetryCount(prev => {
                const newCount = prev + 1;
                if (newCount < MAX_RETRY_ATTEMPTS) {
                  retryTimeout = setTimeout(() => {
                    if (watchId) {
                      navigator.geolocation.clearWatch(watchId);
                    }
                    watchId = startWatching();
                  }, RETRY_DELAY);
                  toast.error(`Nouvelle tentative de localisation (${newCount}/${MAX_RETRY_ATTEMPTS})`);
                } else {
                  toast.error("Impossible d'obtenir votre position. Veuillez vérifier vos paramètres GPS");
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
          maximumAge: 5000,
          timeout: 10000
        }
      );
    };

    watchId = startWatching();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [request, user, isLoaded, retryCount]);

  // Composant pour afficher le statut de la géolocalisation
  const GeoStatusIndicator = () => {
    if (geoStatus === 'trying') {
      return (
        <div className="absolute top-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Mise à jour de la position...</span>
          </div>
        </div>
      );
    }
    if (geoStatus === 'error') {
      return (
        <div className="absolute top-2 left-2 bg-red-500/50 text-white px-3 py-1 rounded-full text-sm z-10">
          Erreur de localisation
        </div>
      );
    }
    return null;
  };

  // Calculer l'itinéraire
  useEffect(() => {
    if (!currentLocation || !request || !isLoaded) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentLocation,
        destination: request.location,
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
  }, [currentLocation, request, isLoaded]);

  const handleCall = () => {
    if (request?.userPhone) {
      window.location.href = `tel:${request.userPhone}`;
    }
  };

  const handleMessage = () => {
    if (request?.userPhone) {
      window.location.href = `sms:${request.userPhone}`;
    }
  };

  const handleGeolocationError = (error: GeolocationPositionError) => {
    const errorMessages: Record<number, string> = {
      1: 'Permission refusée. Veuillez autoriser la géolocalisation.',
      2: 'Position indisponible. Vérifiez votre connexion GPS.',
      3: 'Délai d\'attente dépassé.'
    };
    
    const message = errorMessages[error.code] || 'Erreur de géolocalisation';
    toast.error(message);
    setGeoErrorCount(prev => prev + 1);
  };

  const calculateDuration = (startTime: number, endTime: number): string => {
    const durationInMinutes = Math.floor((endTime - startTime) / (1000 * 60));
    
    if (durationInMinutes < 60) {
      return `${durationInMinutes} min`;
    }
    
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}min`;
  };

  const handleComplete = async () => {
    if (!request || !user || isProcessing) return;

    setIsProcessing(true);
    try {
      // Mettre à jour la demande
      await updateDoc(doc(db, 'helpRequests', request.id), {
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now(),
        finalLocation: currentLocation,
        duration: calculateDuration(request.acceptedAt || 0, Date.now()) // Ajouter la durée
      });

      // Mettre à jour le statut du mécanicien
      await updateDoc(doc(db, 'users', user.uid), {
        currentRequest: null,
        available: true,
        lastCompletedRequest: request.id,
        lastLocation: currentLocation,
        completedRequests: increment(1) // Incrémenter le compteur d'interventions
      });

      toast.success('Intervention terminée avec succès');
      router.push('/mechanic/dashboard');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la completion de la demande');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoaded || !request) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <MechanicRoute>
      <Layout>
        <div className="min-h-screen bg-gray-100 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Map Section */}
              <div className="h-[400px] relative">
                <GeoStatusIndicator />
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  zoom={13}
                  center={request?.location || center}
                  options={{
                    zoomControl: true,
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: true
                  }}
                >
                  {/* Client location marker */}
                  {request?.location && (
                    <Marker
                      position={request.location}
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
                        text: 'Client',
                        className: 'map-marker-label',
                        color: '#FF4B4B',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    />
                  )}

                  {/* Current location marker */}
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
                  
                  {/* Show directions if available */}
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

              {/* Route Info */}
              {routeInfo && (
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

              {/* Informations Section */}
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-900">Détails de l'intervention</h1>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleMessage}
                      className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                    >
                      <FaComment className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleCall}
                      className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                    >
                      <FaPhone className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Adresse</p>
                        <p className="text-gray-900">{request.location.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FaCar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Véhicule</p>
                        <p className="text-gray-900">
                          {request.vehicleBrand} - {request.vehicleLicensePlate}
                        </p>
                        <p className="text-sm text-gray-500">{request.vehicleType}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <FaTools className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Panne</p>
                        <p className="text-gray-900">{request.breakdownType}</p>
                        <p className="text-sm text-gray-500">{request.description}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FaPhone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact</p>
                        <p className="text-gray-900">+32 {request.userPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {request.status === 'accepted' && (
                  <div className="mt-6">
                    <button
                      onClick={handleComplete}
                      disabled={isProcessing}
                      className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          Traitement...
                        </>
                      ) : (
                        "Terminer l'intervention"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </MechanicRoute>
  );
};

export default RequestDetails; 