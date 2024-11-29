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
    
    // Apply the format XX-XXX-XX
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}`;
  };

  const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicensePlate(e.target.value);
    if (formatted.length <= 10) { // XX-XXX-XX = 10 characters
      setLicensePlate(formatted);
      
      // Validate format when complete
      if (formatted.length === 10) {
        const isValid = /^[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z0-9]{2}$/.test(formatted);
        setLicensePlateError(isValid ? '' : 'Format invalide. Utilisez le format XX-XXX-XX');
      } else {
        setLicensePlateError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlateError) {
      onSubmit({
        type: vehicleType,
        brand: vehicleBrand,
        licensePlate: licensePlate,
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white [&>option]:text-white"
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
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white [&>option]:text-white"
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
          <input
            type="text"
            value={licensePlate}
            onChange={handleLicensePlateChange}
            placeholder="Plaque d'immatriculation (XX-XXX-XX)"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400"
            required
            maxLength={10}
          />
          {licensePlateError && (
            <p className="mt-1 text-red-500 text-sm">{licensePlateError}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors"
          disabled={!!licensePlateError}
        >
          Continuer
        </button>
      </form>

      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <p className="text-white mb-2">Position sélectionnée :</p>
        <p className="text-gray-400 text-sm mb-4">{location.address}</p>
        <LocationMap center={{ lat: location.lat, lng: location.lng }} />
      </div>
    </div>
  );
};

export default VehicleForm; 