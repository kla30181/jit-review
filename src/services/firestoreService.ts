import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { firebaseApp } from './firebaseClient';
import { auth } from './firebaseAuth';
import { DiseaseItem, SubmissionRecord, RespondentInfo, LevelFeedback } from '../types';
import { INITIAL_DISEASE_ITEMS } from '../data/defaultCriteria';
import {
  saveDiseaseCriteria as saveLocalCriteria,
  loadDiseaseCriteria as loadLocalCriteria,
} from './storageService';

export const db = getFirestore(firebaseApp);

const DATASET_DOC_ID = 'jit_criteria';

export const checkAdminPermission = async (uid: string): Promise<boolean> => {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists() && snap.data()?.active !== false;
  } catch (error) {
    console.warn('Cannot verify admin role:', error);
    return false;
  }
};

/**
 * Validate Firestore connection
 */
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    const testDoc = await getDocFromServer(doc(db, 'datasets', 'connection_test'));
    return true;
  } catch (err) {
    console.warn('Firestore connection check:', err);
    return false;
  }
};

/**
 * Subscribe to real-time criteria updates from Firestore
 * Ensures PC and Notebook always stay in sync!
 */
export const subscribeToCriteria = (
  onUpdate: (items: DiseaseItem[], source: 'cloud' | 'local') => void
) => {
  const criteriaDocRef = doc(db, 'datasets', DATASET_DOC_ID);

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
  if (!auth.currentUser || !(await checkAdminPermission(auth.currentUser.uid))) return false;

  try {
    const criteriaDocRef = doc(db, 'datasets', DATASET_DOC_ID);
    await setDoc(criteriaDocRef, {
      id: DATASET_DOC_ID,
      items,
      count: items.length,
      updatedAt: new Date().toISOString(),
      updatedTimestamp: serverTimestamp(),
    });
    saveLocalCriteria(items);
    return true;
  } catch (err) {
    console.error('Failed to save criteria to cloud:', err);
    return false;
  }
};

/**
 * Force fetch latest criteria from Cloud
 */
export const fetchCriteriaFromCloud = async (): Promise<DiseaseItem[] | null> => {
  try {
    const criteriaDocRef = doc(db, 'datasets', DATASET_DOC_ID);
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
  if (!auth.currentUser) return () => {};
  const subsColRef = query(collection(db, 'submissions'), where('ownerUid', '==', auth.currentUser.uid));

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

      onUpdate(cloudSubs);
    },
    (err) => {
      console.error('Submissions subscription error:', err);
      onUpdate([]);
    }
  );

  return unsubscribe;
};

/**
 * Save a submission to Cloud Firestore and local storage
 */
export const saveSubmissionToCloud = async (submission: SubmissionRecord): Promise<boolean> => {
  if (!auth.currentUser) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึก Firestore");
  try {
    const subDocRef = doc(db, 'submissions', submission.id);
    await setDoc(subDocRef, {
      ...submission,
      ownerUid: auth.currentUser.uid,
      savedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Failed to save submission to cloud:', err);
    throw err;
  }
};

export interface CloudDraft {
  respondent: RespondentInfo;
  feedback: Record<string, LevelFeedback>;
}

export const subscribeToDraft = (
  uid: string,
  onUpdate: (draft: CloudDraft | null) => void,
  onError: (error: Error) => void,
) => onSnapshot(doc(db, 'drafts', uid), snapshot => {
  if (!snapshot.exists()) { onUpdate(null); return; }
  const data = snapshot.data();
  onUpdate({
    respondent: data.respondent || { fullName: '', positionOrg: '' },
    feedback: data.feedback || {},
  });
}, onError);

export const saveDraftToCloud = async (
  uid: string,
  respondent: RespondentInfo,
  feedback: Record<string, LevelFeedback>,
): Promise<void> => {
  if (auth.currentUser?.uid !== uid) throw new Error('ไม่พบผู้ใช้ที่เข้าสู่ระบบ');
  await setDoc(doc(db, 'drafts', uid), {
    ownerUid: uid,
    respondent,
    feedback,
    updatedAt: serverTimestamp(),
  });
};
