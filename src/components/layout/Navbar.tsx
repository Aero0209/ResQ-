import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useStore';

const Navbar: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary-600">DépannExpress</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/services" className="text-gray-700 hover:text-primary-600">
              Services
            </Link>
            {user ? (
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                Tableau de bord
              </Link>
            ) : (
              <Link href="/login" className="bg-primary-600 text-white px-4 py-2 rounded-md">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 