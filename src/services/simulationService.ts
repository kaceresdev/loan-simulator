import { collection, doc, getDoc, setDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { LoanInput } from '../types';

export interface SavedSimulation extends LoanInput {
  id: string;
  shortCode: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  userName: string;
  userEmail: string;
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

export async function saveSimulation(data: LoanInput, userName: string, userEmail: string): Promise<string> {
  const shortCode = generateShortCode();
  const id = shortCode; // Use shortCode as document ID
  const path = `simulations/${id}`;
  
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const simulationData = {
      amount: Number(data.amount) || 0,
      annualInterestRate: Number(data.annualInterestRate) || 0,
      termMonths: Math.max(1, Math.floor(Number(data.termMonths) || 1)),
      startDate: String(data.startDate || new Date().toISOString().split('T')[0]),
      openingFeeType: data.openingFeeType === 'fixed' ? 'fixed' : 'percent',
      openingFeeValue: Number(data.openingFeeValue) || 0,
      isOpeningFeeFinanced: Boolean(data.isOpeningFeeFinanced),
      insuranceSinglePremium: Number(data.insuranceSinglePremium) || 0,
      isInsuranceFinanced: Boolean(data.isInsuranceFinanced),
      recurringMonthlyCosts: Number(data.recurringMonthlyCosts) || 0,
      loanType: data.loanType || '',
      ...(data.userProvidedApr !== undefined && { userProvidedApr: Number(data.userProvidedApr) }),
      id,
      shortCode,
      userName: String(userName || 'Anónimo').substring(0, 100),
      userEmail: String(userEmail || '').substring(0, 100),
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
  const shortCode = code.toUpperCase();
  const path = `simulations/${shortCode}`;
  try {
    const docSnap = await getDoc(doc(db, 'simulations', shortCode));
    
    if (!docSnap.exists()) {
      return null;
    }

    const docData = docSnap.data() as SavedSimulation;
    
    // Safety check in code (Rules already prevent this)
    if (docData.expiresAt && docData.expiresAt.toDate() < new Date()) {
      return null;
    }

    return docData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null; // unreachable
  }
}
