import React from 'react';
import { FaMapMarkerAlt, FaCar, FaTools, FaPhone, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HelpRequest } from '@/types/request';

interface ActiveRequestsProps {
  requests: HelpRequest[];
  isLoading: boolean;
}

const ActiveRequests: React.FC<ActiveRequestsProps> = ({ requests, isLoading }) => {
  const activeRequests = requests.filter((request): request is HelpRequest => {
    return (
      (request.status === 'assigned' || request.status === 'accepted') && 
      !!request.mechanicId &&
      !!request.mechanicName &&
      !!request.mechanicPhone &&
      !!request.assignedAt
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeRequests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg shadow-lg p-6">
          {/* En-tête avec statut */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                request.status === 'accepted' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status === 'accepted' ? 'En intervention' : 'En attente de confirmation'}
              </span>
              {request.assignedAt && (
                <span className="text-sm text-gray-500">
                  Assigné le {format(request.assignedAt, "d MMMM 'à' HH:mm", { locale: fr })}
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
                  <p className="text-sm text-gray-500">
                    Plaque: {request.vehicleLicensePlate}
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
                  <p className="font-medium text-gray-700">Mécanicien assigné</p>
                  <p className="text-gray-600">{request.mechanicName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FaPhone className="w-5 h-5 text-accent-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">Contacts</p>
                  <p className="text-gray-600">
                    Client: +32 {request.userPhone}
                  </p>
                  <p className="text-gray-600">
                    Mécanicien: {request.mechanicPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {activeRequests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Aucune intervention en cours</p>
        </div>
      )}
    </div>
  );
};

export default ActiveRequests; 