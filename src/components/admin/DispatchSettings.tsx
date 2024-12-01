import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { SystemSettings } from '@/types/settings';

const DispatchSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'dispatch'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as SystemSettings);
        } else {
          // Créer les paramètres par défaut
          const defaultSettings: SystemSettings = {
            id: 'dispatch',
            dispatchMode: 'auto',
            updatedAt: Date.now(),
            updatedBy: user?.uid || 'system'
          };
          await setDoc(doc(db, 'settings', 'dispatch'), defaultSettings);
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleModeChange = async (mode: 'auto' | 'dispatcher') => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updatedSettings: SystemSettings = {
        id: 'dispatch',
        dispatchMode: mode,
        updatedAt: Date.now(),
        updatedBy: user.uid
      };

      await setDoc(doc(db, 'settings', 'dispatch'), updatedSettings);
      setSettings(updatedSettings);
      toast.success('Paramètres mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      toast.error('Erreur lors de la mise à jour des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Configuration du dispatch</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleModeChange('auto')}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg ${
              settings?.dispatchMode === 'auto'
                ? 'bg-accent-500 text-white'
                : 'bg-gray-200 text-gray-700'
            } disabled:opacity-50`}
          >
            Mode Auto
          </button>
          
          <button
            onClick={() => handleModeChange('dispatcher')}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg ${
              settings?.dispatchMode === 'dispatcher'
                ? 'bg-accent-500 text-white'
                : 'bg-gray-200 text-gray-700'
            } disabled:opacity-50`}
          >
            Mode Dispatcher
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Mode actuel : {
            settings?.dispatchMode === 'auto' ? 'Attribution automatique' : 'Attribution par dispatcher'
          }</p>
          <p>
            {settings?.dispatchMode === 'auto' 
              ? 'Les mécaniciens choisissent les demandes à accepter'
              : 'Les dispatchers attribuent les demandes aux mécaniciens'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default DispatchSettings; 