// vitest.setup.ts
import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock specific CSS (no globs)
vi.mock('@/app/globals.css', () => ({}));

// Next.js Router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

// next/image: remove invalid props from DOM
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: { fill?: unknown; priority?: unknown; loader?: unknown; quality?: unknown; sizes?: unknown; [key: string]: unknown }) => {
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
    onAuthStateChanged: vi.fn((auth: unknown, cb: (user: unknown) => void) => {
      // No default user
      cb(null);
      return () => {};
    }),
  };
});
