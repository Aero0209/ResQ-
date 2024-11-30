import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useLoadScript } from '@react-google-maps/api';
import VehicleForm from './VehicleForm';
import BreakdownForm from '../breakdown/BreakdownForm';
import ContactForm from '../contact/ContactForm';
import WaitingScreen from '../waiting/WaitingScreen';
import ProgressSteps from '../progress/ProgressSteps';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Suggestion {
  place_id: string;
  description: string;
}

const libraries: ["places"] = ["places"];

const SearchBar = () => {
  const { user } = useAuth();
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [requestStatus, setRequestStatus] = useState('pending');

  useEffect(() => {
    if (!requestId) return;

    try {
      const unsubscribe = onSnapshot(doc(db, 'helpRequests', requestId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setRequestStatus(data.status);
          console.log('Request status updated:', data.status);
        }
      }, (error) => {
        console.error('Error listening to request status:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up listener:', error);
    }
  }, [requestId]);

  useEffect(() => {
    let autocompleteService: google.maps.places.AutocompleteService | null = null;

    if (isLoaded && window.google) {
      autocompleteService = new google.maps.places.AutocompleteService();
    }

    const fetchSuggestions = async () => {
      if (!value.trim() || !autocompleteService) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await autocompleteService.getPlacePredictions({
          input: value,
          componentRestrictions: { country: 'be' },
          types: ['address'],
          language: 'fr'
        });

        if (response && response.predictions) {
          setSuggestions(
            response.predictions
              .filter(prediction => prediction.description.includes(','))
              .map(prediction => ({
                place_id: prediction.place_id,
                description: prediction.description,
              }))
          );
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des suggestions:', err);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(() => {
      if (value) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, isLoaded]);

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setValue(suggestion.description);
    setShowSuggestions(false);

    if (isLoaded && window.google) {
      const geocoder = new google.maps.Geocoder();
      try {
        const result = await geocoder.geocode({ placeId: suggestion.place_id });
        if (result.results[0].geometry?.location) {
          const location = result.results[0].geometry.location;
          setSelectedLocation({
            lat: location.lat(),
            lng: location.lng(),
            address: suggestion.description,
          });
          setCurrentStep(1);
        }
      } catch (err) {
        console.error('Erreur lors du géocodage:', err);
      }
    }
  };

  const handleLocationClick = () => {
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude: lat, longitude: lng } = position.coords;
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&language=fr&region=BE`
            );
            const data = await response.json();
            
            if (data.results[0]) {
              const address = data.results[0].formatted_address;
              setSelectedLocation({ lat, lng, address });
              setValue(address);
              setCurrentStep(1);
            }
          } catch (err) {
            setError('Erreur lors de la récupération de l\'adresse');
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError('Erreur de géolocalisation');
          setLoading(false);
        }
      );
    } else {
      setError('Géolocalisation non supportée');
      setLoading(false);
    }
  };

  const handleVehicleSubmit = (data: { type: string; brand: string; licensePlate: string }) => {
    setVehicleData(data);
    setCurrentStep(2);
  };

  const handleBreakdownSubmit = (data: { type: string; description: string }) => {
    setBreakdownData(data);
    setCurrentStep(3);
  };

  const handleContactSubmit = async (data: { phoneNumber: string }) => {
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'helpRequests'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        userPhone: data.phoneNumber,
        location: selectedLocation,
        vehicleType: vehicleData.type,
        vehicleBrand: vehicleData.brand,
        vehicleLicensePlate: vehicleData.licensePlate,
        breakdownType: breakdownData.type,
        description: breakdownData.description,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mechanicId: null
      });

      setContactData(data);
      setCurrentStep(4);
      setRequestId(docRef.id);
      setRequestStatus('pending');
      toast.success('Votre demande a été envoyée avec succès !');
    } catch (error) {
      console.error('Error creating help request:', error);
      toast.error('Une erreur est survenue lors de l\'envoi de votre demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loadError) return <div>Erreur de chargement</div>;
  if (!isLoaded) return <div>Chargement...</div>;

  const renderStep = () => {
    if (!selectedLocation) {
      return (
        <div className="relative">
          <div className="flex items-center">
            <div className="flex-1 flex items-center border border-gray-600 rounded-lg p-3 bg-gray-800/50">
              <FaMapMarkerAlt className="text-gray-400 mx-2" />
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Entrez votre adresse"
                className="w-full bg-transparent text-white outline-none"
                autoComplete="off"
              />
            </div>
            <button
              onClick={handleLocationClick}
              disabled={loading}
              className="ml-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? 'Localisation...' : 'Localiser'}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.description}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-2 text-red-500">
              {error}
            </div>
          )}
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <VehicleForm onSubmit={handleVehicleSubmit} location={selectedLocation} />;
      case 2:
        return (
          <BreakdownForm
            onSubmit={handleBreakdownSubmit}
            onBack={() => setCurrentStep(1)}
            location={selectedLocation}
            vehicleType={vehicleData.type}
          />
        );
      case 3:
        return (
          <ContactForm
            onSubmit={handleContactSubmit}
            onBack={() => setCurrentStep(2)}
            location={selectedLocation}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        if (selectedLocation && vehicleData && breakdownData && contactData) {
          return (
            <WaitingScreen
              location={selectedLocation}
              vehicleData={vehicleData}
              breakdownData={breakdownData}
              contactData={contactData}
              requestId={requestId}
              status={requestStatus}
              isLoaded={isLoaded}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="w-full search-container">
      {selectedLocation && currentStep < 4 && <ProgressSteps currentStep={currentStep} />}
      {renderStep()}
    </div>
  );
};

export default SearchBar;
