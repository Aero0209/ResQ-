import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FaMapMarkerAlt, FaCar, FaTools, FaPhone, FaUserCog } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import MechanicSelector from '@/components/mechanic/MechanicSelector';

interface PendingRequest {
  id: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  vehicleBrand: string;
  vehicleType: string;
  vehicleLicensePlate: string;
  breakdownType: string;
  description: string;
  userPhone: string;
  createdAt: number;
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  isLoading: boolean;
}

const PendingRequests: React.FC<PendingRequestsProps> = ({ requests, isLoading }) => {
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);

  const handleAssign = async (requestId: string, mechanicId: string) => {
    try {
      await updateDoc(doc(db, 'helpRequests', requestId), {
        status: 'assigned',
        mechanicId,
        assignedAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success('Demande assignée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      toast.error('Erreur lors de l\'assignation de la demande');
    } finally {
      setAssigningRequestId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Informations de localisation */}
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

            {/* Informations de panne et contact */}
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

          {/* Section d'assignation */}
          <div className="mt-6 border-t pt-4">
            {assigningRequestId === request.id ? (
              <MechanicSelector
                onSelect={(mechanicId: string) => handleAssign(request.id, mechanicId)}
                onCancel={() => setAssigningRequestId(null)}
                requestLocation={request.location}
              />
            ) : (
              <button
                onClick={() => setAssigningRequestId(request.id)}
                className="flex items-center justify-center space-x-2 w-full bg-accent-500 text-white py-2 rounded-lg hover:bg-accent-600 transition-colors"
              >
                <FaUserCog />
                <span>Assigner un mécanicien</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {requests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Aucune demande en attente</p>
        </div>
      )}
    </div>
  );
};

export default PendingRequests; 