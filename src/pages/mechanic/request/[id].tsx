import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
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
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [geoErrorCount, setGeoErrorCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 5;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // Écouter les mises à jour de la demande
  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = onSnapshot(doc(db, 'helpRequests', id as string), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
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
          mechanicLocation: data.mechanicLocation
        };

        setRequest(requestData);

        // Si le statut est "accepted", on arrête d'écouter les mises à jour
        if (data.status === 'accepted' && data.mechanicId === user.uid) {
          unsubscribe();
        }
      }
    });

    return () => {
      unsubscribe();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [id, user]);

  // Gérer le suivi de la position actuelle
  useEffect(() => {
    if (!request || !user || request.mechanicId !== user.uid || !isLoaded || geoErrorCount >= MAX_RETRY_ATTEMPTS) return;

    if ('geolocation' in navigator) {
      const watchIdNum = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          setGeoErrorCount(0); // Réinitialiser le compteur d'erreurs en cas de succès

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

      setWatchId(watchIdNum);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [request, user, isLoaded, geoErrorCount]);

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

  const handleComplete = async () => {
    if (!request) return;

    try {
      await updateDoc(doc(db, 'helpRequests', request.id), {
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success('Intervention terminée avec succès');
      router.push('/mechanic/dashboard');
    } catch (error) {
      console.error('Erreur lors de la completion de la demande:', error);
      toast.error('Erreur lors de la completion de la demande');
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
                      className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Terminer l'intervention
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