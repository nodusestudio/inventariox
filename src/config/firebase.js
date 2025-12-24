import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCaD0XG0tqMmTNreT3MjfoUVOZZ4RLyOvA",
  authDomain: "inventariox-55d9e.firebaseapp.com",
  projectId: "inventariox-55d9e",
  storageBucket: "inventariox-55d9e.firebasestorage.app",
  messagingSenderId: "244996866370",
  appId: "1:244996866370:web:835e6b0d9c367e86dc08db",
  measurementId: "G-GPFQKF76TM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
