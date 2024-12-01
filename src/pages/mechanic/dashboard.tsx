import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import Layout from '@/components/layout/Layout';
import MechanicRoute from '@/components/auth/MechanicRoute';
import { toast } from 'react-hot-toast';
import { RequestStatus } from '@/types/auth';
import { SystemSettings, DispatchMode } from '@/types/settings';
import { FaMapMarkerAlt, FaCar, FaTools, FaPhone } from 'react-icons/fa';
import { Tab } from '@headlessui/react';
import InterventionHistory from '@/components/mechanic/InterventionHistory';
import { Intervention } from '@/types/intervention';

interface HelpRequest {
  id: string;
  userId: string;
  userPhone: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  vehicleType: string;
  vehicleBrand: string;
  vehicleLicensePlate: string;
  breakdownType: string;
  description: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: number;
  mechanicId?: string;
}

// Fonction pour calculer la durée d'une intervention
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

const MechanicDashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [completedInterventions, setCompletedInterventions] = useState<Intervention[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user || !settings) return;

    // En mode dispatcher, chercher une demande assignée et rediriger
    if (settings.dispatchMode === 'dispatcher' as DispatchMode) {
      const assignedRequestQuery = query(
        collection(db, 'helpRequests'),
        where('mechanicId', '==', user.uid),
        where('status', '==', 'assigned')
      );

      const unsubscribe = onSnapshot(assignedRequestQuery, (snapshot) => {
        const assignedRequests = snapshot.docs;
        if (assignedRequests.length > 0) {
          // Rediriger vers la première demande assignée
          router.push(`/mechanic/request/${assignedRequests[0].id}`);
        }
      });

      // Ajouter une requête pour voir toutes les demandes en attente
      const pendingRequestsQuery = query(
        collection(db, 'helpRequests'),
        where('status', '==', 'pending')
      );

      const unsubscribePending = onSnapshot(pendingRequestsQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HelpRequest[];
        setHelpRequests(requests);
        setLoading(false);
      });

      return () => {
        unsubscribe();
        unsubscribePending();
      };
    }

    // En mode auto, afficher toutes les demandes en attente
    const requestsQuery = query(
      collection(db, 'helpRequests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpRequest[];
      setHelpRequests(requests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, settings, router]);

  useEffect(() => {
    if (!user) return;

    const historyQuery = query(
      collection(db, 'helpRequests'),
      where('mechanicId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const interventions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          completedAt: data.completedAt,
          acceptedAt: data.acceptedAt,
          location: data.location,
          vehicleBrand: data.vehicleBrand,
          vehicleType: data.vehicleType,
          vehicleLicensePlate: data.vehicleLicensePlate,
          breakdownType: data.breakdownType,
          description: data.description,
          duration: data.duration,
          mechanicId: data.mechanicId,
          userId: data.userId,
          status: data.status as 'completed'
        } as Intervention;
      });
      setCompletedInterventions(interventions);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequest = async (requestId: string) => {
    if (!user || processingRequestId || !settings) return;

    if (settings.dispatchMode === 'dispatcher' as DispatchMode) {
      toast.error('En mode dispatch, seul le dispatcher peut assigner les demandes');
      return;
    }

    setProcessingRequestId(requestId);
    try {
      const requestRef = doc(db, 'helpRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        toast.error('Demande introuvable');
        return;
      }

      const requestData = requestDoc.data();

      // Vérifier le mode de dispatch
      const isDispatcherMode = settings.dispatchMode === 'dispatcher' as DispatchMode;

      if (isDispatcherMode) {
        // En mode dispatcher, la demande est déjà assignée
        await updateDoc(requestRef, {
          status: 'accepted' as RequestStatus,
          acceptedAt: Date.now(),
          updatedAt: Date.now()
        });
      } else {
        // En mode auto
        await updateDoc(requestRef, {
          status: 'accepted' as RequestStatus,
          mechanicId: user.uid,
          mechanicName: user.displayName || 'Mécanicien',
          mechanicPhone: user.phoneNumber || 'Non disponible',
          estimatedArrival: '15-20 minutes',
          acceptedAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      toast.success('Demande acceptée avec succès !');
      router.push(`/mechanic/request/${requestId}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!user || processingRequestId) return;

    setProcessingRequestId(requestId);
    try {
      const requestRef = doc(db, 'helpRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected' as RequestStatus,
        rejectedBy: user.uid,
        rejectedAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success('Demande rejetée');
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
      toast.error('Erreur lors du rejet de la demande');
    } finally {
      setProcessingRequestId(null);
    }
  };

  return (
    <MechanicRoute>
      <Layout>
        <div className="min-h-screen bg-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 mb-6 shadow">
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected
                      ? 'bg-accent-500 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Demandes en cours
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected
                      ? 'bg-accent-500 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Historique
                </Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  {settings?.dispatchMode === 'dispatcher' as DispatchMode ? (
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Mode Dispatch
                      </h2>
                      <p className="text-gray-600">
                        En attente d'attribution de demande par le dispatcher...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                          Demandes en attente
                        </h1>
                      </div>

                      {loading ? (
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
                        </div>
                      ) : (
                        <div className="grid gap-6">
                          {helpRequests.map((request) => (
                            <div
                              key={request.id}
                              className="bg-white rounded-lg shadow-lg p-6"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div className="space-y-4">
                                  <div className="flex items-start space-x-3">
                                    <FaMapMarkerAlt className="w-5 h-5 text-accent-500 mt-1" />
                                    <div>
                                      <p className="font-medium text-gray-700">Adresse</p>
                                      <p className="text-gray-600">{request.location.address}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start space-x-3">
                                    <FaCar className="w-5 h-5 text-accent-500 mt-1" />
                                    <div>
                                      <p className="font-medium text-gray-700">Véhicule</p>
                                      <p className="text-gray-600">
                                        {request.vehicleBrand} - {request.vehicleType}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Plaque: {request.vehicleLicensePlate}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-start space-x-3">
                                    <FaTools className="w-5 h-5 text-accent-500 mt-1" />
                                    <div>
                                      <p className="font-medium text-gray-700">Type de panne</p>
                                      <p className="text-gray-600">{request.breakdownType}</p>
                                      <p className="text-sm text-gray-500">{request.description}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start space-x-3">
                                    <FaPhone className="w-5 h-5 text-accent-500 mt-1" />
                                    <div>
                                      <p className="font-medium text-gray-700">Contact</p>
                                      <p className="text-gray-600">+32 {request.userPhone}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end space-x-3 mt-4">
                                {settings?.dispatchMode === 'dispatcher' as DispatchMode ? (
                                  <p className="text-sm text-gray-500 italic">
                                    En attente d'assignation par le dispatcher
                                  </p>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => rejectRequest(request.id)}
                                      disabled={!!processingRequestId}
                                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                    >
                                      Refuser
                                    </button>
                                    <button
                                      onClick={() => handleRequest(request.id)}
                                      disabled={!!processingRequestId}
                                      className={`px-4 py-2 ${
                                        processingRequestId === request.id
                                          ? 'bg-gray-500'
                                          : 'bg-green-500 hover:bg-green-600'
                                      } text-white rounded-lg transition-colors disabled:opacity-50`}
                                    >
                                      {processingRequestId === request.id ? (
                                        <div className="flex items-center space-x-2">
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                          <span>Traitement...</span>
                                        </div>
                                      ) : (
                                        'Accepter'
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}

                          {helpRequests.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                              <p className="text-gray-500">
                                {settings?.dispatchMode === 'dispatcher' as DispatchMode
                                  ? 'Aucune demande ne vous a été assignée'
                                  : 'Aucune demande en attente'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Tab.Panel>
                <Tab.Panel>
                  <InterventionHistory
                    interventions={completedInterventions}
                    isLoading={loadingHistory}
                  />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </Layout>
    </MechanicRoute>
  );
};

export default MechanicDashboard; 