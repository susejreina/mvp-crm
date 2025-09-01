// vitest.setup.ts
import '@testing-library/jest-dom';
import React from 'react';

// Mock CSS concreto (no globs)
vi.mock('@/app/globals.css', () => ({}));

// Router de Next
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

// next/image: quita props no válidos del DOM
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, loader, quality, sizes, ...rest } = props;
    return React.createElement('img', rest);
  },
}));


vi.mock('firebase/auth', async () => {
  class GoogleAuthProvider {
    addScope(_scope: string) {}
  }
  return {
    GoogleAuthProvider,
    getAuth: () => ({}),
    signInWithPopup: vi.fn(async () => ({ user: { uid: 'u1', email: 'a@b.com' } })),
    signInWithEmailAndPassword: vi.fn(async () => ({ user: { uid: 'u1', email: 'a@b.com' } })),
    sendPasswordResetEmail: vi.fn(async () => ({})),
    onAuthStateChanged: vi.fn((auth: any, cb: any) => {
      // No user por defecto
      cb(null);
      return () => {};
    }),
  };
});
