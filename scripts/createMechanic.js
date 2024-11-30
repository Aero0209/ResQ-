require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyB9m-pripECGfvI40Q4GjSsKmZFj-ZMEqk",
  authDomain: "resq-e22a7.firebaseapp.com",
  projectId: "resq-e22a7",
  storageBucket: "resq-e22a7.firebasestorage.app",
  messagingSenderId: "66957009223",
  appId: "1:66957009223:web:00fca9f6773b3d4c3a6c62",
  measurementId: "G-WCEN1C4JBC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createMechanic() {
  try {
    // Créer l'utilisateur avec email/mot de passe
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'mechanic@resq.com',
      'password123'
    );

    const user = userCredential.user;

    // Mettre à jour le profil
    await updateProfile(user, {
      displayName: 'Jean Dupont',
      photoURL: 'https://example.com/mechanic-photo.jpg'
    });

    // Créer le document utilisateur dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: 'Jean Dupont',
      role: 'mechanic',
      phone: '+32470123456',
      rating: 4.8,
      totalJobs: 127,
      specialties: ['Panne moteur', 'Batterie', 'Pneus', 'Dépannage général'],
      available: true,
      location: {
        lat: 50.8503,
        lng: 4.3517
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    console.log('Mécanicien créé avec succès:', user.uid);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création du mécanicien:', error);
    process.exit(1);
  }
}

createMechanic(); 