import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userData = await signInWithEmail(email, password);
      if (userData.role === 'mechanic') {
        router.push('/mechanic/dashboard');
      } else if (userData.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Échec de la connexion. Vérifiez vos identifiants.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userData = await signInWithGoogle();
      if (userData.role === 'mechanic') {
        router.push('/mechanic/dashboard');
      } else if (userData.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Échec de la connexion avec Google.');
    }
  };

  const quickLogin = async (role: string) => {
    try {
      let email, password;
      switch (role) {
        case 'admin':
          email = 'admin@resq.com';
          password = 'admin123';
          break;
        case 'mechanic':
          email = 'mechanic@resq.com';
          password = 'password123';
          break;
        case 'dispatcher':
          email = 'dispatcher@resq.com';
          password = 'dispatcher123';
          break;
        case 'user':
          email = 'user@resq.com';
          password = 'user123';
          break;
        default:
          return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      if (role === 'mechanic') {
        router.push('/mechanic/dashboard');
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur lors de la connexion rapide');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à votre compte
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-accent-500 focus:border-accent-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-accent-500 focus:border-accent-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
            >
              Se connecter
            </button>
          </div>
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Se connecter avec Google
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-center text-lg font-medium text-gray-900 mb-4">
            Connexions rapides (Test)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLogin('admin')}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              Admin
            </button>
            <button
              onClick={() => quickLogin('owner')}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Propriétaire
            </button>
            <button
              onClick={() => quickLogin('dispatcher')}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Dispatcher
            </button>
            <button
              onClick={() => quickLogin('mechanic')}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
            >
              Mécanicien
            </button>
            <button
              onClick={() => quickLogin('user')}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 col-span-2"
            >
              Utilisateur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 