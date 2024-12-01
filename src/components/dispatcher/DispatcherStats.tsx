import React from 'react';
import { FaUserClock, FaTools, FaUsers } from 'react-icons/fa';

interface DispatcherStatsProps {
  availableMechanics: number;
  busyMechanics: number;
  totalMechanics: number;
  totalRequests: number;
  pendingRequests: number;
}

const DispatcherStats: React.FC<DispatcherStatsProps> = ({
  availableMechanics,
  busyMechanics,
  totalMechanics,
  totalRequests,
  pendingRequests
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Mécaniciens disponibles</p>
            <p className="text-2xl font-bold text-green-500">{availableMechanics}</p>
          </div>
          <FaUserClock className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Sur {totalMechanics} mécaniciens au total
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Mécaniciens en intervention</p>
            <p className="text-2xl font-bold text-accent-500">{busyMechanics}</p>
          </div>
          <FaTools className="w-8 h-8 text-accent-500" />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {((busyMechanics / totalMechanics) * 100).toFixed(1)}% des mécaniciens
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Demandes en attente</p>
            <p className="text-2xl font-bold text-yellow-500">{pendingRequests}</p>
          </div>
          <FaUsers className="w-8 h-8 text-yellow-500" />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Sur {totalRequests} demandes au total
        </p>
      </div>
    </div>
  );
};

export default DispatcherStats; 