import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseClient';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

let sessionMarker: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  if (!firebaseAuth) {
    onAuthFailure?.();
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      sessionMarker = 'firebase-authenticated';
      onAuthSuccess?.(user, sessionMarker);
    } else {
      sessionMarker = null;
      onAuthFailure?.();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!firebaseAuth) {
    throw new Error('ยังไม่ได้ตั้งค่า Firebase กรุณากำหนด VITE_FIREBASE_* ก่อนใช้งาน');
  }

  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    sessionMarker = 'firebase-authenticated';
    return { user: result.user, accessToken: sessionMarker };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('ยกเลิกการเข้าสู่ระบบ Google');
    }
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('โดเมนนี้ยังไม่ได้เพิ่มใน Firebase Authentication > Authorized domains');
    }
    throw error;
  }
};

// คงชื่อฟังก์ชันเดิมไว้เพื่อไม่ให้ UI เดิมต้องเปลี่ยน
// ไม่ใช่ Google Sheets OAuth token อีกต่อไป
export const getAccessToken = async (): Promise<string | null> => sessionMarker;

export const logout = async () => {
  if (firebaseAuth) await signOut(firebaseAuth);
  sessionMarker = null;
};
