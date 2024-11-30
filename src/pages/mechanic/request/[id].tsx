import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import MechanicRoute from '@/components/auth/MechanicRoute';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
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

const RequestDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [mechanicLocation, setMechanicLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  // Écouter les mises à jour de la demande
  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = onSnapshot(doc(db, 'helpRequests', id as string), (doc) => {
      if (doc.exists()) {
        setRequest({ id: doc.id, ...doc.data() } as RequestDetails);
      }
    });

    return () => {
      unsubscribe();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [id, user]);

  // Gérer le suivi de la position du mécanicien
  useEffect(() => {
    if (!request || !user || request.mechanicId !== user.uid) return;

    if ('geolocation' in navigator) {
      const watchIdNum = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMechanicLocation(newLocation);

          // Mettre à jour la position dans Firestore
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
          toast.error('Erreur lors du suivi de votre position');
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
  }, [request, user]);

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
              <div className="h-96 relative">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={request.location}
                  zoom={13}
                >
                  {/* Marker pour le client */}
                  <Marker
                    position={request.location}
                    icon={{
                      url: '/icons/client-marker.png',
                      scaledSize: new google.maps.Size(40, 40)
                    }}
                  />
                  {/* Marker pour le mécanicien */}
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