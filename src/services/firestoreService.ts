import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  serverTimestamp,
  getDocFromServer,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { firestoreDb, firebaseAuth } from './firebaseClient';
import { DiseaseItem, SubmissionRecord } from '../types';
import { INITIAL_DISEASE_ITEMS } from '../data/defaultCriteria';
import {
  saveDiseaseCriteria as saveLocalCriteria,
  loadDiseaseCriteria as loadLocalCriteria,
  saveSubmission as saveLocalSubmission,
  loadSubmissions as loadLocalSubmissions,
} from './storageService';

const app = firebaseApp;

// Initialize Firestore with specific database ID from config
export const db = firestoreDb as ReturnType<typeof getFirestore>;

const DATASET_DOC_ID = 'disease_criteria';

/**
 * Validate Firestore connection
 */
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    const testDoc = await getDocFromServer(doc(db, 'jit_settings', 'connection_test'));
    return true;
  } catch (err) {
    console.warn('Firestore connection check:', err);
    throw err;
  }
};

/**
 * Subscribe to real-time criteria updates from Firestore
 * Ensures PC and Notebook always stay in sync!
 */
export const subscribeToCriteria = (
  onUpdate: (items: DiseaseItem[], source: 'cloud' | 'local') => void
) => {
  const criteriaDocRef = doc(db, 'jit_settings', DATASET_DOC_ID);

  const unsubscribe = onSnapshot(
    criteriaDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          // Update local cache as backup
          saveLocalCriteria(data.items);
          onUpdate(data.items, 'cloud');
          return;
        }
      }
      // If document doesn't exist in cloud yet, check local storage
      const local = loadLocalCriteria();
      // If local has items (could be modified on this machine), seed cloud with local
      if (local && local.length > 0) {
        if (firebaseAuth?.currentUser) saveCriteriaToCloud(local).catch((e) =>
          console.warn('Auto-seed to cloud failed:', e)
        );
        onUpdate(local, 'local');
      } else {
        onUpdate(INITIAL_DISEASE_ITEMS, 'local');
      }
    },
    (error) => {
      console.error('Firestore criteria subscription error:', error);
      // Fallback to local
      const local = loadLocalCriteria();
      onUpdate(local, 'local');
    }
  );

  return unsubscribe;
};

/**
 * Save disease criteria to Cloud Firestore and local storage
 */
export const saveCriteriaToCloud = async (items: DiseaseItem[]): Promise<boolean> => {
  // Always update local cache first
  saveLocalCriteria(items);

  try {
    const criteriaDocRef = doc(db, 'jit_settings', DATASET_DOC_ID);
    await setDoc(criteriaDocRef, {
      id: DATASET_DOC_ID,
      items,
      count: items.length,
      updatedAt: new Date().toISOString(),
      updatedTimestamp: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Failed to save criteria to cloud:', err);
    throw err;
  }
};

/**
 * Force fetch latest criteria from Cloud
 */
export const fetchCriteriaFromCloud = async (): Promise<DiseaseItem[] | null> => {
  try {
    const criteriaDocRef = doc(db, 'jit_settings', DATASET_DOC_ID);
    const snap = await getDoc(criteriaDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        saveLocalCriteria(data.items);
        return data.items;
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch criteria from cloud:', err);
    return null;
  }
};

/**
 * Subscribe to submissions in real-time from Cloud
 */
export const subscribeToSubmissions = (
  onUpdate: (submissions: SubmissionRecord[]) => void
) => {
  const subsColRef = collection(db, 'jit_submissions');

  const unsubscribe = onSnapshot(
    subsColRef,
    (snapshot) => {
      const cloudSubs: SubmissionRecord[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data() as SubmissionRecord;
        if (d && d.id) {
          cloudSubs.push(d);
        }
      });

      // Sort by newest first
      cloudSubs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (cloudSubs.length > 0) {
        onUpdate(cloudSubs);
      } else {
        const local = loadLocalSubmissions();
        onUpdate(local);
      }
    },
    (err) => {
      console.error('Submissions subscription error:', err);
      const local = loadLocalSubmissions();
      onUpdate(local);
    }
  );

  return unsubscribe;
};

/**
 * Save a submission to Cloud Firestore and local storage
 */
export const saveSubmissionToCloud = async (submission: SubmissionRecord): Promise<boolean> => {
  saveLocalSubmission(submission);

  try {
    if (!db) throw new Error('ยังไม่ได้ตั้งค่า Firebase');
    const subDocRef = doc(db, 'jit_submissions', submission.id);
    if (!firebaseAuth?.currentUser) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนบันทึก');
    await setDoc(subDocRef, {
      ...submission,
      ownerUid: firebaseAuth?.currentUser.uid,
      ownerEmail: firebaseAuth?.currentUser.email || null,
      savedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Failed to save submission to cloud:', err);
    throw err;
  }
};
