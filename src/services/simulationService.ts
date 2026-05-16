import { collection, doc, getDoc, setDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LoanInput } from '../types';

export interface SavedSimulation extends LoanInput {
  id: string;
  shortCode: string;
  createdAt: Timestamp;
}

// Generate a random 6-character short code
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function saveSimulation(data: LoanInput): Promise<string> {
  const shortCode = generateShortCode();
  const id = doc(collection(db, 'simulations')).id;
  
  const simulationData = {
    ...data,
    id,
    shortCode,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'simulations', id), simulationData);
  return shortCode;
}

export async function getSimulationByCode(code: string): Promise<SavedSimulation | null> {
  const q = query(collection(db, 'simulations'), where('shortCode', '==', code.toUpperCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }

  const docData = querySnapshot.docs[0].data();
  return docData as SavedSimulation;
}
