import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));

interface LocationState {
  userLocation: GeolocationCoordinates | null;
  setUserLocation: (location: GeolocationCoordinates | null) => void;
}

export const useLocationStore = create<LocationState>()((set) => ({
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
})); 