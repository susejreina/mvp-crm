import AuthGate from '@/components/auth/AuthGate';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AuthGate>
  );
}