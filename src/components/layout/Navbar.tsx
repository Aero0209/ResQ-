import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { FaUser, FaTools, FaCog, FaHeadset, FaClipboardList } from 'react-icons/fa';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { settings } = useSystemSettings();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getDashboardLink = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return {
          href: '/admin/dashboard',
          icon: <FaCog className="w-5 h-5" />,
          text: 'Admin'
        };
      case 'mechanic':
        return {
          href: '/mechanic/dashboard',
          icon: <FaTools className="w-5 h-5" />,
          text: 'Demandes'
        };
      case 'dispatcher':
        return {
          href: '/dispatcher/dashboard',
          icon: <FaClipboardList className="w-5 h-5" />,
          text: 'Dispatch'
        };
      default:
        return null;
    }
  };

  const dashboardLink = getDashboardLink();

  // Afficher un badge si le mode dispatcher est activé
  const getDispatchModeIndicator = () => {
    if (user?.role === 'dispatcher' || user?.role === 'admin') {
      return (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
          settings?.dispatchMode === 'dispatcher' 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-500 text-white'
        }`}>
          {settings?.dispatchMode === 'dispatcher' ? 'Mode Dispatch' : 'Mode Auto'}
        </span>
      );
    }
    return null;
  };

  return (
    <nav className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="logo-text text-2xl font-bold">
            ResQ
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-2 text-sm">
                  <FaUser className="text-accent-500" />
                  <span className="text-gray-300">
                    {user.displayName || user.email}
                    <span className="ml-2 px-2 py-1 bg-accent-500 text-white rounded-full text-xs">
                      {user.role}
                    </span>
                    {getDispatchModeIndicator()}
                  </span>
                </div>

                {/* Dashboard Link */}
                {dashboardLink && (
                  <Link
                    href={dashboardLink.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                      router.pathname.startsWith(dashboardLink.href)
                        ? 'bg-accent-500 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-accent-500'
                    }`}
                  >
                    {dashboardLink.icon}
                    <span>{dashboardLink.text}</span>
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="border border-accent-500 text-accent-500 hover:bg-accent-500 hover:text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 