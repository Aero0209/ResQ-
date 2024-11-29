import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { HelpRequest } from '@/types/auth';
import Layout from '@/components/layout/Layout';
import MechanicRoute from '@/components/auth/MechanicRoute';
import { FaMapMarkerAlt, FaCar, FaTools, FaPhone } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const MechanicDashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
        
        // Afficher une notification toast
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
    if (!user) return;

    try {
      const requestRef = doc(db, 'helpRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        mechanicId: user.uid,
        updatedAt: Date.now()
      });
      toast.success('Demande acceptée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la demande:', error);
      toast.error('Erreur lors de l\'acceptation de la demande');
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const requestRef = doc(db, 'helpRequests', requestId);
      await updateDoc(requestRef, {
        status: 'cancelled',
        updatedAt: Date.now()
      });
      toast.success('Demande rejetée');
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
      toast.error('Erreur lors du rejet de la demande');
    }
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
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FaCar className="text-accent-500" />
                      <h3 className="text-lg font-semibold">
                        {request.vehicleType || 'Véhicule non spécifié'}
                      </h3>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      En attente
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start space-x-2">
                      <FaTools className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Type de panne</p>
                        <p className="text-sm text-gray-900">{request.breakdownType}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <FaMapMarkerAlt className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Localisation</p>
                        <p className="text-sm text-gray-900">{request.location.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <FaPhone className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact</p>
                        <p className="text-sm text-gray-900">{request.userPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-sm text-gray-900">{request.description}</p>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => rejectRequest(request.id)}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => acceptRequest(request.id)}
                      className="flex-1 bg-accent-500 text-white py-2 px-4 rounded-lg hover:bg-accent-600 transition-colors"
                    >
                      Accepter
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