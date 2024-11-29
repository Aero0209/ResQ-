import React, { useState } from 'react';
import { FaCar, FaTruck, FaMotorcycle, FaShuttleVan, FaQuestion } from 'react-icons/fa';

interface VehicleFormProps {
  onSubmit: (data: { type: string; brand: string; licensePlate: string }) => void;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface VehicleType {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const vehicleTypes: VehicleType[] = [
  { id: 'voiture', label: 'Voiture', Icon: FaCar },
  { id: 'moto', label: 'Moto', Icon: FaMotorcycle },
  { id: 'camionnette', label: 'Camionnette', Icon: FaShuttleVan },
  { id: 'camion', label: 'Camion', Icon: FaTruck },
  { id: 'autre', label: 'Autre', Icon: FaQuestion },
];

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-white mb-2">Type de véhicule</label>
        <div className="grid grid-cols-3 gap-3">
          {vehicleTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setVehicleType(type.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                vehicleType === type.id
                  ? 'border-accent-500 bg-accent-500/20'
                  : 'border-gray-600 hover:border-accent-500/50'
              }`}
            >
              <type.Icon className="w-8 h-8 mb-2" />
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
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
          <option value="autre">Autre</option>
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
    </form>
  );
};

export default VehicleForm; 