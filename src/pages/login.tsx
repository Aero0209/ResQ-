import { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { FirebaseError } from 'firebase/app';

const Login: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await signInWithEmail(email, password);
      if (userData.isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('Email ou mot de passe incorrect');
            break;
          case 'auth/too-many-requests':
            setError('Trop de tentatives. Veuillez réessayer plus tard');
            break;
          default:
            setError('Une erreur est survenue lors de la connexion');
        }
      } else {
        setError('Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const userData = await signInWithGoogle();
      if (userData.isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError('Erreur lors de la connexion avec Google');
      } else {
        setError('Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-gray-900 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Connexion</h1>

            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400"
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent-500 text-white py-3 rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Ou continuer avec</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mt-4 w-full bg-white text-gray-900 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <FaGoogle />
                <span>Google</span>
              </button>
            </div>

            <p className="mt-8 text-center text-gray-400">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-accent-500 hover:text-accent-400">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login; 