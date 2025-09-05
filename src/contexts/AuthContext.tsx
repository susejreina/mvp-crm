'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthUser } from '@/lib/auth/service';
import { isValidVendor, getVendorByEmail } from '@/lib/firestore/auth';
import { Vendor } from '@/lib/types';

interface AuthContextType {
  user: AuthUser | null;
  vendor: Vendor | null;
  loading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (authUser) => {
      setLoading(true);
      
      if (!authUser || !authUser.email) {
        setUser(null);
        setVendor(null);
        setLoading(false);
        return;
      }

      // Check if the authenticated user is a valid vendor
      const isVendor = await isValidVendor(authUser.email);
      
      if (isVendor) {
        // Get full vendor data including role
        const vendorData = await getVendorByEmail(authUser.email);
        setUser(authUser);
        setVendor(vendorData);
      } else {
        setUser(null);
        setVendor(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = vendor?.role === 'admin';
  const isSeller = vendor?.role === 'seller';

  const value: AuthContextType = {
    user,
    vendor,
    loading,
    isAdmin,
    isSeller,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}