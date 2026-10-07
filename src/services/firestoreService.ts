import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { DiseaseItem, SubmissionRecord } from '../types';
import { firestoreDb } from './firebaseClient';

const SUBMISSIONS_COLLECTION = 'jit_submissions';
const SETTINGS_COLLECTION = 'jit_settings';
const CRITERIA_DOC = 'disease_criteria';

function requireDb() {
  if (!firestoreDb) throw new Error('ยังไม่ได้ตั้งค่า Firebase/Firestore');
  return firestoreDb;
}

export async function saveSubmissionToFirestore(submission: SubmissionRecord, user: User) {
  const db = requireDb();
  await setDoc(doc(db, SUBMISSIONS_COLLECTION, submission.id), {
    ...submission,
    ownerUid: user.uid,
    ownerEmail: user.email || null,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadSubmissionsFromFirestore(): Promise<SubmissionRecord[]> {
  const db = requireDb();
  const snapshot = await getDocs(
    query(collection(db, SUBMISSIONS_COLLECTION), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      respondent: data.respondent,
      responses: data.responses || {},
      createdAt: data.createdAt,
    } as SubmissionRecord;
  });
}

export async function loadDiseaseCriteriaFromFirestore(): Promise<DiseaseItem[] | null> {
  const db = requireDb();
  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, CRITERIA_DOC));
  if (!snapshot.exists()) return null;
  const items = snapshot.data()?.items;
  return Array.isArray(items) ? (items as DiseaseItem[]) : null;
}

export async function saveDiseaseCriteriaToFirestore(items: DiseaseItem[], user?: User | null) {
  const db = requireDb();
  await setDoc(doc(db, SETTINGS_COLLECTION, CRITERIA_DOC), {
    items,
    updatedAt: new Date().toISOString(),
    updatedByUid: user?.uid || null,
    updatedByEmail: user?.email || null,
  });
}
