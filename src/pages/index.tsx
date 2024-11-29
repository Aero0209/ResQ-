import { NextPage } from 'next';
import Head from 'next/head';
import { FaWrench, FaShieldAlt, FaClock, FaTools } from 'react-icons/fa';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>ResQ - Assistance Routière</title>
        <meta name="description" content="Service d'assistance routière en temps réel" />
      </Head>
      
      {/* Navbar */}
      <nav className="bg-black text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <FaWrench className="text-white text-xl" />
            <span className="font-bold text-xl">ResQ</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/connexion" className="text-white hover:text-gray-300">
              Connexion
            </Link>
            <Link href="/inscription" className="text-white hover:text-gray-300">
              Inscription
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">
              Besoin d&apos;un dépannage ?
            </h1>
            <p className="text-gray-300 mb-8">
              Trouvez un dépanneur professionnel près de chez vous en quelques clics
            </p>

            <SearchBar />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-black p-4 rounded-full mb-4">
                <FaClock className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Disponible</h3>
              <p className="text-gray-600">Service disponible jour et nuit, 7 jours sur 7</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-black p-4 rounded-full mb-4">
                <FaTools className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dépanneurs Qualifiés</h3>
              <p className="text-gray-600">Des professionnels expérimentés à votre service</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-black p-4 rounded-full mb-4">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Service Sécurisé</h3>
              <p className="text-gray-600">Paiement et intervention 100% sécurisés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Users */}
      <div className="fixed bottom-4 left-4 text-sm bg-black text-white px-4 py-2 rounded-full">
        <span>1 utilisateurs connectés</span>
      </div>
    </>
  );
};

export default Home; 