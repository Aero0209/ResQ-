import React, { useState } from 'react';
import LocationMap from '../map/LocationMap';

interface ContactFormProps {
  onSubmit: (contactData: {
    phoneNumber: string;
  }) => void;
  onBack: () => void;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, onBack, location }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as Belgian phone number: +32 XXX XX XX XX
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.length <= 14) { // +32 XXX XX XX XX = 14 characters
      setPhoneNumber(formatted);
      
      // Validate when complete
      if (formatted.length === 14) {
        const isValid = /^\d{2} \d{3} \d{2} \d{2}$/.test(formatted);
        setError(isValid ? '' : 'Numéro de téléphone invalide');
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!error) {
      onSubmit({
        phoneNumber: phoneNumber,
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 bg-gray-800 border border-gray-600 rounded-lg p-3">
            <span className="text-white">+32</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="XXX XX XX XX"
              className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
              required
            />
          </div>
          {error && (
            <p className="mt-1 text-red-500 text-sm">{error}</p>
          )}
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
            disabled={!!error || !phoneNumber}
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

export default ContactForm; 