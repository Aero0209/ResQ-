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
    
    // Format as Belgian mobile number: 04XX XX XX XX
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  };

  const validatePhoneNumber = (number: string) => {
    // Belgian mobile number format: 04XX XX XX XX
    const cleanedNumber = number.replace(/\s/g, '');
    const belgianMobileRegex = /^0(4\d{8}|[1-9]\d{7})$/;
    return belgianMobileRegex.test(cleanedNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.length <= 13) { // 04XX XX XX XX = 13 characters
      setPhoneNumber(formatted);
      
      if (formatted.length > 0) {
        const isValid = validatePhoneNumber(formatted);
        setError(isValid ? '' : 'Numéro de téléphone belge invalide (ex: 0470 12 34 56)');
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!error && validatePhoneNumber(phoneNumber)) {
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
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="0470 12 34 56"
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
            className="flex-1 bg-accent-500 text-white py-3 rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!phoneNumber || !!error}
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