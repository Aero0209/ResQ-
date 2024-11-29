import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import AdminRoute from '@/components/auth/AdminRoute';
import Layout from '@/components/layout/Layout';

interface Request {
  id: string;
  timestamp: Date;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  vehicle: {
    type: string;
    brand: string;
    licensePlate: string;
  };
  breakdown: {
    type: string;
    description: string;
  };
  contact: {
    phoneNumber: string;
  };
  status: 'pending' | 'accepted' | 'completed';
}

const Dashboard: NextPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.isAdmin) return;

    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Request[];
      
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <AdminRoute>
      <Layout>
        <div className="min-h-screen bg-black text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
            </div>

            {/* Synthflow Widget */}
            <div className="fixed bottom-4 right-4 z-50">
              <iframe
                id="audio_iframe"
                src="https://widget.synthflow.ai/widget/v2/1732900904728x995075968396729900/1732900904634x227248438209721280"
                allow="microphone"
                width="400"
                height="600"
                style={{
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
              </div>
            ) : (
              <div className="grid gap-6">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-900 rounded-lg p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {request.vehicle.brand} - {request.vehicle.licensePlate}
                        </h3>
                        <p className="text-gray-400">{request.location.address}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        request.status === 'pending' ? 'bg-yellow-500 text-black' :
                        request.status === 'accepted' ? 'bg-accent-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {request.status === 'pending' ? 'En attente' :
                         request.status === 'accepted' ? 'En cours' :
                         'Terminé'}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-300">Véhicule</h4>
                        <p>Type: {request.vehicle.type}</p>
                        <p>Marque: {request.vehicle.brand}</p>
                        <p>Plaque: {request.vehicle.licensePlate}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-300">Panne</h4>
                        <p>Type: {request.breakdown.type}</p>
                        <p>Description: {request.breakdown.description}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                      <div>
                        <p className="text-gray-300">
                          Contact: {request.contact.phoneNumber}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        {request.status === 'pending' && (
                          <button
                            className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
                          >
                            Accepter
                          </button>
                        )}
                        {request.status === 'accepted' && (
                          <button
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Terminer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {requests.length === 0 && (
                  <div className="text-center py-12 bg-gray-900 rounded-lg">
                    <p className="text-gray-400">Aucune demande pour le moment</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
};

export default Dashboard; 