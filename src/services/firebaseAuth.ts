import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseApp } from './firebaseClient';

export const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
export const initAuth = (onSuccess?: (user: User, token: string | null) => void, onFailure?: () => void) =>
  onAuthStateChanged(auth, user => user ? onSuccess?.(user, null) : onFailure?.());
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const result = await signInWithPopup(auth, provider);
  return { user: result.user, accessToken: await result.user.getIdToken() };
};
export const getAccessToken = async (): Promise<string | null> => auth.currentUser?.getIdToken() ?? null;
export const logout = async () => signOut(auth);
