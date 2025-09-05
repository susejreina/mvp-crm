'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth/service';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGate({ children, fallback }: AuthGateProps) {
  const { user, vendor, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !vendor)) {
      // If user is not authenticated or not a valid vendor, sign out and redirect
      if (user && !vendor) {
        authService.signOut();
      }
      router.replace('/login');
    }
  }, [user, vendor, loading, router]);

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      )
    );
  }

  if (!loading && (!user || !vendor)) {
    return null; // The useEffect already redirects to /login
  }

  return <>{children}</>;
}