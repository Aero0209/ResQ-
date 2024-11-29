import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useStore';
import { FaBars, FaTimes, FaUser } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <span className="logo-text text-3xl font-black text-white">
                ResQ
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/services" 
              className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
            >
              Services
            </Link>
            <Link 
              href="/about" 
              className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
            >
              À propos
            </Link>
            {user ? (
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-2 bg-accent-500 text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition-colors"
              >
                <FaUser />
                <span>Mon compte</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-white hover:text-accent-400 transition-colors"
                >
                  Connexion
                </Link>
                <Link 
                  href="/register" 
                  className="bg-accent-500 text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/services"
                className="block text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link 
                href="/about"
                className="block text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                À propos
              </Link>
              {user ? (
                <Link 
                  href="/dashboard"
                  className="block bg-accent-500 text-white px-3 py-2 rounded-lg hover:bg-accent-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon compte
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login"
                    className="block text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link 
                    href="/register"
                    className="block bg-accent-500 text-white px-3 py-2 rounded-lg hover:bg-accent-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 