require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

type UserRole = 'admin' | 'owner' | 'dispatcher' | 'mechanic' | 'user';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Firebase config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testAccounts = [
  { email: 'admin@resq.com', password: 'testadmin123', role: 'admin' as UserRole },
  { email: 'owner@resq.com', password: 'testowner123', role: 'owner' as UserRole },
  { email: 'dispatcher@resq.com', password: 'testdispatcher123', role: 'dispatcher' as UserRole },
  { email: 'mechanic@resq.com', password: 'testmechanic123', role: 'mechanic' as UserRole },
  { email: 'user@resq.com', password: 'testuser123', role: 'user' as UserRole },
];

async function createTestAccount(email: string, password: string, role: UserRole) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      displayName: role.charAt(0).toUpperCase() + role.slice(1),
      createdAt: Date.now(),
      lastLogin: Date.now()
    });

    console.log(`✅ Created ${role} account:`, email);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ Account already exists:`, email);
    } else {
      console.error(`❌ Error creating ${role} account:`, error);
    }
  }
}

async function createAllTestAccounts() {
  console.log('🚀 Creating test accounts...');
  
  for (const account of testAccounts) {
    await createTestAccount(account.email, account.password, account.role);
  }
  
  console.log('✨ Done creating test accounts');
  process.exit(0);
}

createAllTestAccounts(); 