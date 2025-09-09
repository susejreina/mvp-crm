// src/lib/auth/service.test.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { authService, AuthServiceError } from './service';

// Mock Firebase Auth (includes GoogleAuthProvider with addScope)
vi.mock('firebase/auth', () => {
  const user = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  class GoogleAuthProvider {
    addScope = vi.fn();
  }

  return {
    __esModule: true,
    GoogleAuthProvider,
    signInWithPopup: vi.fn(async () => ({ user })),
    signInWithEmailAndPassword: vi.fn(async (auth, email: string) => {
      if (email === 'bad@test.com') {
        const err = new Error('Invalid') as Error & { code: string };
        err.code = 'auth/invalid-credential';
        throw err;
      }
      return { user };
    }),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    onAuthStateChanged: vi.fn(),
    getAuth: vi.fn(() => ({})),
  };
});

// Mock Firebase config
vi.mock('../firebase', () => ({
  auth: {}, // we use an empty object in expects
}));

describe('AuthService', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithEmailPassword', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUserCredential = { user: mockUser };
      (signInWithEmailAndPassword as Mock).mockResolvedValue(mockUserCredential);

      const result = await authService.signInWithEmailPassword('test@example.com', 'password');

      expect(result.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'test@example.com', 'password');
    });

    it('should throw AuthServiceError with mapped error message', async () => {
      const firebaseError = { code: 'auth/invalid-credential', message: 'Invalid credential' };
      (signInWithEmailAndPassword as Mock).mockRejectedValue(firebaseError);

      await expect(
        authService.signInWithEmailPassword('test@example.com', 'wrongpassword')
      ).rejects.toThrow(AuthServiceError);

      try {
        await authService.signInWithEmailPassword('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthServiceError);
        expect((error as AuthServiceError).title).toBe('Credenciales inválidas');
        expect((error as AuthServiceError).message).toBe(
          'El email o la contraseña son incorrectos. Verifica tus datos e intenta de nuevo.'
        );
      }
    });

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error');
      (signInWithEmailAndPassword as Mock).mockRejectedValue(unknownError);

      await expect(
        authService.signInWithEmailPassword('test@example.com', 'password')
      ).rejects.toThrow(AuthServiceError);
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in successfully with Google', async () => {
      const mockUserCredential = { user: mockUser };
      (signInWithPopup as Mock).mockResolvedValue(mockUserCredential);

      const result = await authService.signInWithGoogle();

      expect(result.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
      expect(signInWithPopup).toHaveBeenCalled(); // optional: verify specific args
    });

    it('should handle popup closed error', async () => {
      const firebaseError = { code: 'auth/popup-closed-by-user', message: 'Popup closed' };
      (signInWithPopup as Mock).mockRejectedValue(firebaseError);

      await expect(authService.signInWithGoogle()).rejects.toThrow(AuthServiceError);

      try {
        await authService.signInWithGoogle();
      } catch (error) {
        expect(error).toBeInstanceOf(AuthServiceError);
        expect((error as AuthServiceError).title).toBe('Inicio de sesión cancelado');
      }
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      (sendPasswordResetEmail as Mock).mockResolvedValue(undefined);

      await expect(authService.sendPasswordReset('test@example.com')).resolves.not.toThrow();

      expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, 'test@example.com');
    });

    it('should handle invalid email error', async () => {
      const firebaseError = { code: 'auth/invalid-email', message: 'Invalid email' };
      (sendPasswordResetEmail as Mock).mockRejectedValue(firebaseError);

      await expect(authService.sendPasswordReset('invalid-email')).rejects.toThrow(AuthServiceError);

      try {
        await authService.sendPasswordReset('invalid-email');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthServiceError);
        expect((error as AuthServiceError).title).toBe('Email inválido');
      }
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      (signOut as Mock).mockResolvedValue(undefined);

      await expect(authService.signOut()).resolves.not.toThrow();

      expect(signOut).toHaveBeenCalledWith({});
    });

    it('should handle sign out errors', async () => {
      const firebaseError = { code: 'auth/internal-error', message: 'Internal error' };
      (signOut as Mock).mockRejectedValue(firebaseError);

      await expect(authService.signOut()).rejects.toThrow(AuthServiceError);
    });
  });

  describe('onAuthStateChanged', () => {
    it('should call callback with mapped user when authenticated', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      (onAuthStateChanged as Mock).mockImplementation((_auth, cb) => {
        cb(mockUser);
        return unsubscribe;
      });

      const result = authService.onAuthStateChanged(callback);

      expect(callback).toHaveBeenCalledWith({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
      expect(result).toBe(unsubscribe);
    });

    it('should call callback with null when not authenticated', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      (onAuthStateChanged as Mock).mockImplementation((_auth, cb) => {
        cb(null);
        return unsubscribe;
      });

      const result = authService.onAuthStateChanged(callback);

      expect(callback).toHaveBeenCalledWith(null);
      expect(result).toBe(unsubscribe);
    });
  });
});
