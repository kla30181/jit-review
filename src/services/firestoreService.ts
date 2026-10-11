import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  serverTimestamp,
  getDocFromServer,
} from "firebase/firestore";
import { firebaseApp } from "./firebaseClient";
import { auth } from "./firebaseAuth";
import {
  DiseaseItem,
  SubmissionRecord,
  RespondentInfo,
  LevelFeedback,
} from "../types";
import { INITIAL_DISEASE_ITEMS } from "../data/defaultCriteria";
import {
  saveDiseaseCriteria as saveLocalCriteria,
  loadDiseaseCriteria as loadLocalCriteria,
} from "./storageService";

// =====================================================
// FIRESTORE CONFIG
// =====================================================
export const db = getFirestore(firebaseApp);
const DATASET_DOC_ID = "jit_criteria";
const criteriaDocRef = () =>
  doc(db, "datasets", DATASET_DOC_ID);

// =====================================================
// ADMIN PERMISSION
// =====================================================
export const checkAdminPermission = async (
  uid: string
): Promise<boolean> => {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return false;
  }
  try {
    const snapshot = await getDoc(
      doc(db, "admins", uid)
    );
    return (
      snapshot.exists() &&
      snapshot.data()?.active === true
    );
  } catch (error) {
    console.error(
      "Cannot verify admin permission:",
      error
    );
    return false;
  }
};

// =====================================================
// FIRESTORE CONNECTION TEST
// =====================================================
export const testFirestoreConnection =
  async (): Promise<boolean> => {
    if (!auth.currentUser) {
      console.warn(
        "Firestore connection check skipped: user not signed in"
      );
      return false;
    }
    try {
      // Read only a document allowed by Firestore Rules.
      // A missing document is not a connection failure.
      await getDocFromServer(criteriaDocRef());
      console.log("Firestore connection OK");
      return true;
    } catch (error) {
      console.error(
        "Firestore connection failed:",
        error
      );
      return false;
    }
  };

// =====================================================
// CRITERIA SUBSCRIPTION
// =====================================================
export const subscribeToCriteria = (
  onUpdate: (
    items: DiseaseItem[],
    source: "cloud" | "local"
  ) => void
) => {
  return onSnapshot(
    criteriaDocRef(),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (
          data &&
          Array.isArray(data.items) &&
          data.items.length > 0
        ) {
          saveLocalCriteria(data.items);
          onUpdate(data.items, "cloud");
          return;
        }
      }
      const local = loadLocalCriteria();
      if (local && local.length > 0) {
        onUpdate(local, "local");
      } else {
        onUpdate(INITIAL_DISEASE_ITEMS, "local");
      }
    },
    (error) => {
      console.error(
        "Firestore criteria subscription error:",
        error
      );
      const local = loadLocalCriteria();
      onUpdate(
        local && local.length > 0
          ? local
          : INITIAL_DISEASE_ITEMS,
        "local"
      );
    }
  );
};

// =====================================================
// SAVE CRITERIA TO CLOUD
// =====================================================
export const saveCriteriaToCloud = async (
  items: DiseaseItem[]
): Promise<boolean> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("Please sign in first");
    return false;
  }
  const isAdmin = await checkAdminPermission(
    currentUser.uid
  );
  if (!isAdmin) {
    console.error(
      "Permission denied: admin access required"
    );
    return false;
  }
  try {
    await setDoc(criteriaDocRef(), {
      id: DATASET_DOC_ID,
      items,
      count: items.length,
      updatedAt: new Date().toISOString(),
      updatedTimestamp: serverTimestamp(),
    });
    saveLocalCriteria(items);
    console.log(
      "Criteria saved to Firestore successfully"
    );
    return true;
  } catch (error) {
    console.error(
      "Failed to save criteria to cloud:",
      error
    );
    return false;
  }
};

// =====================================================
// FETCH CRITERIA
// =====================================================
export const fetchCriteriaFromCloud =
  async (): Promise<DiseaseItem[] | null> => {
    if (!auth.currentUser) {
      return null;
    }
    try {
      const snapshot = await getDoc(
        criteriaDocRef()
      );
      if (!snapshot.exists()) {
        return null;
      }
      const data = snapshot.data();
      if (
        !data ||
        !Array.isArray(data.items) ||
        data.items.length === 0
      ) {
        return null;
      }
      saveLocalCriteria(data.items);
      return data.items;
    } catch (error) {
      console.error(
        "Failed to fetch criteria from cloud:",
        error
      );
      return null;
    }
  };

// =====================================================
// SUBMISSIONS SUBSCRIPTION
// =====================================================
export const subscribeToSubmissions = (
  onUpdate: (submissions: SubmissionRecord[]) => void
) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    onUpdate([]);
    return () => {};
  }
  const submissionsQuery = query(
    collection(db, "submissions"),
    where("ownerUid", "==", currentUser.uid)
  );
  return onSnapshot(
    submissionsQuery,
    (snapshot) => {
      const cloudSubmissions: SubmissionRecord[] = [];
      snapshot.forEach((documentSnapshot) => {
        const data =
          documentSnapshot.data() as SubmissionRecord;
        if (data && data.id) {
          cloudSubmissions.push(data);
        }
      });
      cloudSubmissions.sort((a, b) => {
        const dateA = new Date(
          a.createdAt || 0
        ).getTime();
        const dateB = new Date(
          b.createdAt || 0
        ).getTime();
        return dateB - dateA;
      });
      onUpdate(cloudSubmissions);
    },
    (error) => {
      console.error(
        "Submissions subscription error:",
        error
      );
      onUpdate([]);
    }
  );
};

// =====================================================
// SAVE SUBMISSION
// =====================================================
export const saveSubmissionToCloud = async (
  submission: SubmissionRecord
): Promise<boolean> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error(
      "กรุณาเข้าสู่ระบบก่อนบันทึก Firestore"
    );
  }
  if (!submission.id) {
    throw new Error(
      "ไม่พบรหัสรายการแบบสอบถาม"
    );
  }
  try {
    const submissionRef = doc(
      db,
      "submissions",
      submission.id
    );
    await setDoc(submissionRef, {
      ...submission,
      ownerUid: currentUser.uid,
      savedAt: serverTimestamp(),
    });
    console.log(
      "Submission saved to Firestore:",
      submission.id
    );
    return true;
  } catch (error) {
    console.error(
      "Failed to save submission to cloud:",
      error
    );
    throw error;
  }
};

// =====================================================
// DRAFT TYPES
// =====================================================
export interface CloudDraft {
  respondent: RespondentInfo;
  feedback: Record<string, LevelFeedback>;
}

// =====================================================
// SUBSCRIBE TO USER DRAFT
// =====================================================
export const subscribeToDraft = (
  uid: string,
  onUpdate: (draft: CloudDraft | null) => void,
  onError: (error: Error) => void
) => {
  if (auth.currentUser?.uid !== uid) {
    onError(
      new Error(
        "ไม่มีสิทธิ์เข้าถึงแบบร่างของผู้ใช้อื่น"
      )
    );
    return () => {};
  }
  return onSnapshot(
    doc(db, "drafts", uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }
      const data = snapshot.data();
      onUpdate({
      respondent: data.respondent || {
          fullName: "",
          positionOrg: "",
        },
        feedback: data.feedback || {},
      });
    },
    onError
  );
};

// =====================================================
// SAVE USER DRAFT
// =====================================================
export const saveDraftToCloud = async (
  uid: string,
  respondent: RespondentInfo,
  feedback: Record<string, LevelFeedback>
): Promise<void> => {
  if (auth.currentUser?.uid !== uid) {
    throw new Error(
      "ไม่พบผู้ใช้ที่เข้าสู่ระบบ หรือไม่มีสิทธิ์บันทึกแบบร่าง"
    );
  }
  await setDoc(doc(db, "drafts", uid), {
    ownerUid: uid,
    respondent,
    feedback,
    updatedAt: serverTimestamp(),
  });
  console.log("Draft saved to Firestore");
};
/**
 * Admin: subscribe to all submissions.
 */
export const subscribeToAllSubmissions = (
  onUpdate: (submissions: SubmissionRecord[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    onError?.(new Error("กรุณาเข้าสู่ระบบ"));
    return () => {};
  }
  let unsubscribe: (() => void) | undefined;
  let cancelled = false;
  void (async () => {
    const allowed = await checkAdminPermission(user.uid);
    if (cancelled) return;
    if (!allowed) {
      onError?.(new Error("ไม่มีสิทธิ์ผู้ดูแลระบบ"));
      return;
    }
    unsubscribe = onSnapshot(
      collection(db, "submissions"),
      (snapshot) => {
        if (cancelled) return;
        const submissions = snapshot.docs.map((item) => {
          const data = item.data() as SubmissionRecord;
          return {
            ...data,
            id: data.id || item.id,
          };
        });
        submissions.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        onUpdate(submissions);
      },
      (error) => {
        console.error("Admin submissions error:", error);
        onError?.(error);
      }
    );
  })().catch((error) => {
    if (!cancelled) {
      onError?.(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  });
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
};

// Edit a submitted response while preserving its owner and creation date.
export const updateSubmissionToCloud = async (submission: SubmissionRecord): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('กรุณาเข้าสู่ระบบ');
  const reference = doc(db, 'submissions', submission.id);
  const original = await getDoc(reference);
  if (!original.exists()) throw new Error('ไม่พบคำตอบที่ต้องการแก้ไข');
  const data = original.data();
  if (data.ownerUid !== currentUser.uid && !(await checkAdminPermission(currentUser.uid))) {
    throw new Error('ไม่มีสิทธิ์แก้ไขรายการนี้');
  }
  await updateDoc(reference, {
    respondent: submission.respondent,
    responses: submission.responses,
    updatedAt: serverTimestamp(),
  });
};
