import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import DispatcherRoute from '@/components/auth/DispatcherRoute';
import DispatcherStats from '@/components/dispatcher/DispatcherStats';
import PendingRequests from '@/components/dispatcher/PendingRequests';
import ActiveRequests from '@/components/dispatcher/ActiveRequests';
import RequestHistory from '@/components/dispatcher/RequestHistory';
import { Tab } from '@headlessui/react';
import { HelpRequest, HistoryRequest } from '@/types/request';

interface MechanicStatus {
  available: number;
  busy: number;
  total: number;
}

const DispatcherDashboard = () => {
  const { user } = useAuth();
  const [mechanicStatus, setMechanicStatus] = useState<MechanicStatus>({
    available: 0,
    busy: 0,
    total: 0
  });
  const [pendingRequests, setPendingRequests] = useState<HelpRequest[]>([]);
  const [activeRequests, setActiveRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedRequests, setCompletedRequests] = useState<HistoryRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Écouter les statuts des mécaniciens
  useEffect(() => {
    if (!user) return;

    const mechanicsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'mechanic')
    );

    const unsubscribe = onSnapshot(mechanicsQuery, (snapshot) => {
      let available = 0;
      let busy = 0;
      const total = snapshot.size;

      snapshot.forEach((doc) => {
        const mechanic = doc.data();
        if (mechanic.currentRequest) {
          busy++;
        } else {
          available++;
        }
      });

      setMechanicStatus({ available, busy, total });
    });

    return () => unsubscribe();
  }, [user]);

  // Écouter les demandes
  useEffect(() => {
    if (!user) return;

    // Demandes en attente
    const pendingQuery = query(
      collection(db, 'helpRequests'),
      where('status', '==', 'pending')
    );

    // Demandes en cours (seulement assigned et accepted)
    const activeQuery = query(
      collection(db, 'helpRequests'),
      where('status', 'in', ['assigned', 'accepted']),
      where('mechanicId', '!=', null)
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpRequest[];
      setPendingRequests(requests);
      setLoading(false);
    });

    const unsubscribeActive = onSnapshot(activeQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpRequest[];
      const validRequests = requests.filter(request => 
        request.mechanicName && 
        request.mechanicPhone && 
        request.assignedAt
      );
      setActiveRequests(validRequests);
    });

    return () => {
      unsubscribePending();
      unsubscribeActive();
    };
  }, [user]);

  // Écouter les demandes terminées
  useEffect(() => {
    if (!user) return;

    const historyQuery = query(
      collection(db, 'helpRequests'),
      where('status', 'in', ['completed', 'cancelled']),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          completedAt: data.completedAt,
          cancelledAt: data.cancelledAt,
          duration: data.duration
        };
      }) as HistoryRequest[];
      setCompletedRequests(requests);
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculer le nombre réel de demandes en cours
  const activeRequestsCount = activeRequests.length;

  return (
    <DispatcherRoute>
      <Layout>
        <div className="min-h-screen bg-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de bord Dispatcher
              </h1>
            </div>

            {/* Statistiques */}
            <DispatcherStats
              availableMechanics={mechanicStatus.available}
              busyMechanics={mechanicStatus.busy}
              totalMechanics={mechanicStatus.total}
              totalRequests={pendingRequests.length + activeRequests.length}
              pendingRequests={pendingRequests.length}
            />

            {/* Onglets */}
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
                  Demandes en attente ({pendingRequests.length})
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
                  Demandes en cours ({activeRequestsCount})
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
                  <PendingRequests
                    requests={pendingRequests}
                    isLoading={loading}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  <ActiveRequests
                    requests={activeRequests}
                    isLoading={loading}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  <RequestHistory
                    requests={completedRequests}
                    isLoading={historyLoading}
                  />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </Layout>
    </DispatcherRoute>
  );
};

export default DispatcherDashboard; 