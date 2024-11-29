import { NextPage } from 'next';
import Head from 'next/head';
import { FaShieldAlt, FaClock, FaTools } from 'react-icons/fa';
import SearchBar from '@/components/search/SearchBar';
import Layout from '@/components/layout/Layout';

const Home: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>ResQ - Assistance Routière</title>
        <meta name="description" content="Service d'assistance routière en temps réel" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Hero Section */}
      <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">
              Besoin d&apos;un dépannage ?
            </h1>
            <p className="text-gray-400 mb-8 text-lg">
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
            <div className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="bg-black p-4 rounded-full mb-4">
                <FaClock className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Disponible</h3>
              <p className="text-gray-600">Service disponible jour et nuit, 7 jours sur 7</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="bg-black p-4 rounded-full mb-4">
                <FaTools className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dépanneurs Qualifiés</h3>
              <p className="text-gray-600">Des professionnels expérimentés à votre service</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="bg-black p-4 rounded-full mb-4">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Service Sécurisé</h3>
              <p className="text-gray-600">Paiement et intervention 100% sécurisés</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home; 