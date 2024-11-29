import React, { useState } from 'react';
import LocationMap from '../map/LocationMap';

interface BreakdownFormProps {
  onSubmit: (breakdownData: {
    type: string;
    description: string;
  }) => void;
  onBack: () => void;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

const BreakdownForm: React.FC<BreakdownFormProps> = ({ onSubmit, onBack, location }) => {
  const [breakdownType, setBreakdownType] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: breakdownType,
      description: description,
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <select
            value={breakdownType}
            onChange={(e) => setBreakdownType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white [&>option]:text-black"
            required
          >
            <option value="" disabled>Type de panne</option>
            <option value="battery">Batterie</option>
            <option value="engine">Moteur</option>
            <option value="tire">Pneu</option>
            <option value="fuel">Carburant</option>
            <option value="keys">Clés</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre problème en détail..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 min-h-[120px]"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Retour
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Continuer
          </button>
        </div>
      </form>

      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <p className="text-white mb-2">Position sélectionnée :</p>
        <p className="text-gray-400 text-sm mb-4">{location.address}</p>
        <LocationMap center={{ lat: location.lat, lng: location.lng }} />
      </div>
    </div>
  );
};

export default BreakdownForm; 