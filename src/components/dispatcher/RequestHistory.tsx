import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaMapMarkerAlt, FaCar, FaTools, FaUser, FaClock } from 'react-icons/fa';

interface HistoryRequest {
  id: string;
  location: {
    address: string;
  };
  vehicleBrand: string;
  vehicleType: string;
  breakdownType: string;
  description: string;
  userPhone: string;
  mechanicName: string;
  mechanicPhone: string;
  status: 'completed' | 'cancelled';
  completedAt?: number;
  cancelledAt?: number;
  duration?: string;
}

interface RequestHistoryProps {
  requests: HistoryRequest[];
  isLoading: boolean;
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ requests, isLoading }) => {
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
          {/* En-tête avec statut */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                request.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {request.status === 'completed' ? 'Terminée' : 'Annulée'}
              </span>
              <span className="text-sm text-gray-500">
                {format(
                  request.status === 'completed' ? request.completedAt! : request.cancelledAt!,
                  "d MMMM yyyy 'à' HH:mm",
                  { locale: fr }
                )}
              </span>
              {request.duration && (
                <span className="text-sm text-gray-500">
                  • Durée: {request.duration}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de la demande */}
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
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FaTools className="w-5 h-5 text-accent-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Type de panne</p>
                  <p className="text-gray-600">{request.breakdownType}</p>
                  <p className="text-sm text-gray-500">{request.description}</p>
                </div>
              </div>
            </div>

            {/* Informations du mécanicien */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FaUser className="w-5 h-5 text-accent-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Mécanicien</p>
                  <p className="text-gray-600">{request.mechanicName}</p>
                  <p className="text-sm text-gray-500">{request.mechanicPhone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FaUser className="w-5 h-5 text-accent-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Client</p>
                  <p className="text-gray-600">+32 {request.userPhone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {requests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Aucune intervention terminée</p>
        </div>
      )}
    </div>
  );
};

export default RequestHistory; 