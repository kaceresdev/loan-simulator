import { collection, doc, getDoc, setDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { LoanInput } from '../types';

export interface SavedSimulation extends LoanInput {
  id: string;
  shortCode: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
  const path = `simulations/${id}`;
  
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const simulationData = {
      ...data,
      id,
      shortCode,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    await setDoc(doc(db, 'simulations', id), simulationData);
    return shortCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return ''; // unreachable
  }
}

export async function getSimulationByCode(code: string): Promise<SavedSimulation | null> {
  const path = 'simulations';
  try {
    const q = query(collection(db, path), where('shortCode', '==', code.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const docData = querySnapshot.docs[0].data() as SavedSimulation;
    
    // Safety check in code (Rules already prevent this)
    if (docData.expiresAt && docData.expiresAt.toDate() < new Date()) {
      return null;
    }

    return docData;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null; // unreachable
  }
}
