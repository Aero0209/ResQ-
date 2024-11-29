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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

interface UserData {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser);
        setUser(userData);
        // Store user data in localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('userData');
      }
      setLoading(false);
    });

    // Check localStorage on mount
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    return () => unsubscribe();
  }, []);

  const getUserData = async (firebaseUser: User): Promise<UserData> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    let isAdmin = false;
    if (userDoc.exists()) {
      isAdmin = userDoc.data().isAdmin === true;
    } else {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        isAdmin: false
      });
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      isAdmin: isAdmin
    };
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
    logout
  };
};

export const checkAuth = () => {
  const userData = localStorage.getItem('userData');
  if (!userData) return null;
  return JSON.parse(userData) as UserData;
}; 