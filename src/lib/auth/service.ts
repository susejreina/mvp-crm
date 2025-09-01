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
    // Evita romper si el mock no implementa addScope:
    (this.googleProvider as any)?.addScope?.('email');
    (this.googleProvider as any)?.addScope?.('profile');
  }

  async signInWithEmailPassword(email: string, password: string) {
    try {
      const cred = await fbSignInWithEmailAndPassword(auth as any, email, password);
      return { user: mapUser(cred.user)! };
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as any)?.code, ...mapped });
    }
  }

  async signInWithGoogle() {
    try {
      const cred = await fbSignInWithPopup(auth as any, this.googleProvider);
      return { user: mapUser(cred.user)! };
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as any)?.code, ...mapped });
    }
  }

  async sendPasswordReset(email: string) {
    try {
      await fbSendPasswordResetEmail(auth as any, email);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as any)?.code, ...mapped });
    }
  }

  async signOut() {
    try {
      await fbSignOut(auth as any);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new AuthServiceError({ code: (err as any)?.code, ...mapped });
    }
  }

  onAuthStateChanged(cb: (user: AuthUser | null) => void) {
    return fbOnAuthStateChanged(auth as any, (u) => cb(mapUser(u)));
  }
}

export const authService: IAuthService = new AuthServiceImpl();

// 👇 IMPORTANTE: exporta la CLASE real (no solo el type)
// para que `expect(e).toBeInstanceOf(AuthServiceError)` funcione
export { AuthServiceError } from './errors';
