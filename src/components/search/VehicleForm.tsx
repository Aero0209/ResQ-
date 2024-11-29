import React, { useState } from 'react';
import LocationMap from '../map/LocationMap';

interface VehicleFormProps {
  onSubmit: (vehicleData: {
    type: string;
    brand: string;
    licensePlate: string;
  }) => void;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, location }) => {
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [licensePlateError, setLicensePlateError] = useState('');

  const formatLicensePlate = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Format as 1-AAA-123
    if (cleaned.length <= 1) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}`;
  };

  const validateLicensePlate = (plate: string) => {
    // Belgian license plate formats:
    // 1-AAA-123
    // 1-ABC-123
    const belgianPlateRegex = /^\d-[A-Z]{3}-\d{3}$/;
    return belgianPlateRegex.test(plate);
  };

  const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicensePlate(e.target.value);
    if (formatted.length <= 9) { // 1-AAA-123 = 9 characters
      setLicensePlate(formatted);
      
      if (formatted.length > 0) {
        const isValid = validateLicensePlate(formatted);
        setLicensePlateError(isValid ? '' : 'Format invalide. Utilisez le format: 1-AAA-123');
      } else {
        setLicensePlateError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlateError && validateLicensePlate(licensePlate)) {
      onSubmit({
        type: vehicleType,
        brand: vehicleBrand,
        licensePlate: licensePlate,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white [&>option]:text-black"
          required
        >
          <option value="" disabled>Type de véhicule</option>
          <option value="car">Voiture</option>
          <option value="motorcycle">Moto</option>
          <option value="van">Camionnette</option>
          <option value="truck">Camion</option>
        </select>
      </div>

      <div>
        <select
          value={vehicleBrand}
          onChange={(e) => setVehicleBrand(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white [&>option]:text-black"
          required
        >
          <option value="" disabled>Marque du véhicule</option>
          <option value="volkswagen">Volkswagen</option>
          <option value="bmw">BMW</option>
          <option value="mercedes">Mercedes</option>
          <option value="audi">Audi</option>
          <option value="peugeot">Peugeot</option>
          <option value="renault">Renault</option>
          <option value="citroen">Citroën</option>
          <option value="toyota">Toyota</option>
          <option value="honda">Honda</option>
          <option value="ford">Ford</option>
          <option value="other">Autre</option>
        </select>
      </div>

      <div>
        <div className="relative">
          <input
            type="text"
            value={licensePlate}
            onChange={handleLicensePlateChange}
            placeholder="Plaque d'immatriculation (1-AAA-123)"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400"
            required
          />
          {licensePlateError && (
            <p className="mt-1 text-red-500 text-sm">{licensePlateError}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-accent-500 text-white py-3 rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!vehicleType || !vehicleBrand || !licensePlate || !!licensePlateError}
      >
        Continuer
      </button>

      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <p className="text-white mb-2">Position sélectionnée :</p>
        <p className="text-gray-400 text-sm mb-4">{location.address}</p>
        <LocationMap center={{ lat: location.lat, lng: location.lng }} />
      </div>
    </form>
  );
};

export default VehicleForm; 