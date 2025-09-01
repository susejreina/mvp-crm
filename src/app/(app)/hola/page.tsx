'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, AuthServiceError } from '@/lib/auth/service';
import Button from '@/components/ui/Button';

export default function HolaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    try {
      await authService.signOut();
      router.replace('/login');
    } catch (err) {
      if (err instanceof AuthServiceError) {
        setError(err.message);
      } else {
        setError('No se pudo cerrar la sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, Director!
          </h1>
          <p className="text-gray-600">
            Bienvenido a tu plataforma de ventas de Academia de IA
          </p>
        </div>

        {error && (
          <div
            className="mb-6 p-3 bg-red-50 text-red-700 rounded-md border border-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Esta es una pantalla placeholder. Próximamente verás aquí tu dashboard completo.
          </p>
          
          <Button
            variant="outline"
            size="lg"
            loading={loading}
            onClick={handleSignOut}
            className="w-full"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}