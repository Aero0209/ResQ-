import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FaCar, FaTools, FaMapMarkerAlt, FaPhone, FaCheck, FaTimes } from 'react-icons/fa';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import MechanicRoute from '@/components/auth/MechanicRoute';
import { toast } from 'react-hot-toast';

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

const MechanicDashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const previousRequestsCount = useRef(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to help requests
    const q = query(
      collection(db, 'helpRequests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: HelpRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as HelpRequest);
      });

      // Vérifier s'il y a de nouvelles demandes
      if (requests.length > previousRequestsCount.current) {
        const newRequests = requests.length - previousRequestsCount.current;
        const message = newRequests === 1
          ? 'Nouvelle demande d\'aide disponible !'
          : `${newRequests} nouvelles demandes d'aide disponibles !`;
        
        // Jouer un son de notification
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log('Erreur lors de la lecture du son:', e));
        
        toast(message, {
          icon: '🚨',
          duration: 5000,
        });
      }

      previousRequestsCount.current = requests.length;
      setHelpRequests(requests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const acceptRequest = async (requestId: string) => {
    if (!user || processingRequestId) return;

    setProcessingRequestId(requestId);
    try {
      const requestRef = doc(db, 'helpRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        mechanicId: user.uid,
        mechanicName: user.displayName || 'Mécanicien',
        mechanicPhone: user.phoneNumber || 'Non disponible',
        estimatedArrival: '15-20 minutes',
        acceptedAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success('Demande acceptée avec succès !');
      router.push(`/mechanic/request/${requestId}`);
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la demande:', error);
      toast.error('Erreur lors de l\'acceptation de la demande');
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
        status: 'rejected',
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

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes === 1) return 'Il y a 1 minute';
    if (minutes < 60) return `Il y a ${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Il y a 1 heure';
    if (hours < 24) return `Il y a ${hours} heures`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Il y a 1 jour';
    return `Il y a ${days} jours`;
  };

  const content = (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord Mécanicien</h1>

        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
          </div>
        ) : helpRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Aucune demande d&apos;aide en attente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full mb-2">
                        {formatTimeAgo(request.createdAt)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.vehicleBrand} - {request.vehicleLicensePlate}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <FaCar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Véhicule</p>
                        <p className="text-sm text-gray-900">{request.vehicleType}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FaTools className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Type de panne</p>
                        <p className="text-sm text-gray-900">{request.breakdownType}</p>
                        <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Localisation</p>
                        <p className="text-sm text-gray-900">{request.location.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FaPhone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact</p>
                        <p className="text-sm text-gray-900">+32 {request.userPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => rejectRequest(request.id)}
                      disabled={!!processingRequestId}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      <FaTimes />
                      <span>Refuser</span>
                    </button>
                    <button
                      onClick={() => acceptRequest(request.id)}
                      disabled={!!processingRequestId}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
                    >
                      <FaCheck />
                      <span>Accepter</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MechanicRoute>
      <Layout>
        {content}
      </Layout>
    </MechanicRoute>
  );
};

export default MechanicDashboard; 