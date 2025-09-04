'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type AuthUser } from '@/lib/auth/service';
import { isValidVendorAdmin } from '@/lib/firestore/auth';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGate({ children, fallback }: AuthGateProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidVendor, setIsValidVendor] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (authUser) => {
      setLoading(true);
      
      if (!authUser) {
        setUser(null);
        setIsValidVendor(false);
        setLoading(false);
        router.replace('/login');
        return;
      }

      // Check if the authenticated user is a valid vendor admin
      if (authUser.email) {
        const isVendorAdmin = await isValidVendorAdmin(authUser.email);
        
        if (isVendorAdmin) {
          setUser(authUser);
          setIsValidVendor(true);
        } else {
          // User is authenticated but not a valid vendor admin
          setUser(null);
          setIsValidVendor(false);
          await authService.signOut(); // Sign out the user
          router.replace('/login');
        }
      } else {
        setUser(null);
        setIsValidVendor(false);
        await authService.signOut();
        router.replace('/login');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [router]);

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

  if (!user || !isValidVendor) {
    return null; // El useEffect ya redirige a /login
  }

  return <>{children}</>;
}