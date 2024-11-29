import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { UserData, UserRole } from '@/types/auth';

// Fonction utilitaire pour vérifier si un rôle a accès au dashboard
export const hasAccess = (role: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    'admin': 4,
    'owner': 3,
    'dispatcher': 2,
    'mechanic': 1,
    'user': 0
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
};

export const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser);
        setUser(userData);
        // Store user data in localStorage with encryption
        const encryptedData = btoa(JSON.stringify(userData)); // Simple encoding, you might want to use a more secure encryption
        localStorage.setItem('userData', encryptedData);
      } else {
        setUser(null);
        localStorage.removeItem('userData');
      }
      setLoading(false);
    });

    // Check localStorage on mount with decryption
    const encryptedData = localStorage.getItem('userData');
    if (encryptedData) {
      try {
        const decryptedData = JSON.parse(atob(encryptedData));
        setUser(decryptedData);
      } catch (error) {
        console.error('Error decoding user data:', error);
        localStorage.removeItem('userData');
      }
    }

    return () => unsubscribe();
  }, []);

  const getUserData = async (firebaseUser: User): Promise<UserData> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    const now = Date.now();
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Update lastLogin
      await setDoc(userRef, { lastLogin: now }, { merge: true });
      
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: data.role,
        displayName: data.displayName || firebaseUser.displayName || undefined,
        phoneNumber: data.phoneNumber || firebaseUser.phoneNumber || undefined,
        createdAt: data.createdAt || now,
        lastLogin: now
      };
    } else {
      // Nouvel utilisateur
      const newUser: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'user', // Rôle par défaut
        displayName: firebaseUser.displayName || undefined,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        createdAt: now,
        lastLogin: now
      };

      await setDoc(userRef, newUser);
      return newUser;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userData = await getUserData(result.user);
      return userData;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUserData(result.user);
      return userData;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userData = await getUserData(result.user);
      return userData;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    hasAccess
  };
};

export const checkAuth = (): UserData | null => {
  const encryptedData = localStorage.getItem('userData');
  if (!encryptedData) return null;
  try {
    return JSON.parse(atob(encryptedData)) as UserData;
  } catch {
    localStorage.removeItem('userData');
    return null;
  }
}; 