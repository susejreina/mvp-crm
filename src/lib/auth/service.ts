// src/lib/auth/service.ts
import {
  GoogleAuthProvider,
  onAuthStateChanged as fbOnAuthStateChanged,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  signInWithPopup as fbSignInWithPopup,
  signOut as fbSignOut,
  User as FbUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { AuthServiceError, mapFirebaseAuthError } from './errors';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

function mapUser(u: FbUser | null): AuthUser | null {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

export interface IAuthService {
  signInWithEmailPassword(email: string, password: string): Promise<{ user: AuthUser }>;
  signInWithGoogle(): Promise<{ user: AuthUser }>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void;
}

class AuthServiceImpl implements IAuthService {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    // Avoid breaking if the mock doesn't implement addScope:
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  async signInWithEmailPassword(email: string, password: string) {
    try {
      const cred = await fbSignInWithEmailAndPassword(auth, email, password);
      return { user: mapUser(cred.user)! };
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as { code?: string })?.code, ...mapped });
    }
  }

  async signInWithGoogle() {
    try {
      const cred = await fbSignInWithPopup(auth, this.googleProvider);
      return { user: mapUser(cred.user)! };
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as { code?: string })?.code, ...mapped });
    }
  }

  async sendPasswordReset(email: string) {
    try {
      await fbSendPasswordResetEmail(auth, email);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as { code?: string })?.code, ...mapped });
    }
  }

  async signOut() {
    try {
      await fbSignOut(auth);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as { code?: string })?.code, ...mapped });
    }
  }

  onAuthStateChanged(cb: (user: AuthUser | null) => void) {
    return fbOnAuthStateChanged(auth, (u) => cb(mapUser(u)));
  }
}

export const authService: IAuthService = new AuthServiceImpl();

// 👇 IMPORTANT: export the real CLASS (not just the type)
// so that `expect(e).toBeInstanceOf(AuthServiceError)` works
export { AuthServiceError } from './errors';
