import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const WaitingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
      <FaSpinner className="w-12 h-12 text-accent-500 animate-spin" />
      <h3 className="text-xl font-semibold text-white">
        Votre demande a été envoyée
      </h3>
      <p className="text-gray-400">
        Nous recherchons un mécanicien disponible dans votre zone. 
        Veuillez patienter pendant qu&apos;un mécanicien accepte votre demande.
      </p>
    </div>
  );
};

export default WaitingScreen; 