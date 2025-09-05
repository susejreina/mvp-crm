'use client';

import AuthGate from '@/components/auth/AuthGate';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGate>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <AppHeader />
          <main className="flex-1">
            {children}
          </main>
          <AppFooter />
        </div>
      </AuthGate>
    </AuthProvider>
  );
}