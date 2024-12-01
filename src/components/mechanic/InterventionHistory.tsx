import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaClock, FaMapMarkerAlt, FaCar } from 'react-icons/fa';
import { Intervention } from '@/types/intervention';

interface InterventionHistoryProps {
  interventions: Intervention[];
  isLoading: boolean;
}

const InterventionHistory: React.FC<InterventionHistoryProps> = ({
  interventions,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Historique des interventions</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {interventions.map((intervention) => (
          <div key={intervention.id} className="p-6 hover:bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaClock className="text-accent-500" />
                  <span>
                    {format(intervention.completedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaMapMarkerAlt className="text-accent-500" />
                  <span>{intervention.location.address}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaCar className="text-accent-500" />
                  <span>
                    {intervention.vehicleBrand} - {intervention.vehicleType}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="font-medium">Type de panne:</span>
                  <span>{intervention.breakdownType}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Durée: {intervention.duration}
                </div>
              </div>
            </div>
          </div>
        ))}
        {interventions.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Aucune intervention terminée
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventionHistory; 