import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity validation as per Firebase integration skill
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to trigger a connection/auth check
    await getDocFromServer(doc(db, '_health', 'connection'));
    console.log('Firebase connection initialized successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Please check your network or configuration.");
    } else {
       console.log('Firebase connection check completed (Permission denied expected if not authenticated)');
    }
  }
}

testConnection();
