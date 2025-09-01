'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authService, type AuthUser, AuthServiceError } from '@/lib/auth/service';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Reset state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = authService.onAuthStateChanged((user: AuthUser | null) => {
      if (user) router.replace('/hola');
    });
    return unsub;
  }, [router]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email) next.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Ingresa un email válido';
    if (!password) next.password = 'La contraseña es requerida';
    else if (password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    setMessage(null);
    try {
      await authService.signInWithEmailPassword(email, password);
    } catch (err) {
      setErrors({
        general:
          err instanceof AuthServiceError ? err.message : 'Ocurrió un error inesperado. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    setErrors({});
    setMessage(null);
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      setErrors({
        general:
          err instanceof AuthServiceError
            ? err.message
            : 'No se pudo iniciar sesión con Google. Intenta de nuevo.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrors({ general: 'Ingresa tu email para enviar el enlace de recuperación' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setErrors({ general: 'Ingresa un email válido' });
      return;
    }
    setResetLoading(true);
    setErrors({});
    setMessage(null);
    try {
      await authService.sendPasswordReset(resetEmail);
      setResetSent(true);
      setMessage({
        type: 'success',
        text: `Se envió un enlace de recuperación a ${resetEmail}. Revisa tu bandeja de entrada.`,
      });
    } catch (err) {
      setErrors({
        general:
          err instanceof AuthServiceError
            ? err.message
            : 'No se pudo enviar el email de recuperación. Intenta de nuevo.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const resetView = () => {
    setShowReset(false);
    setResetEmail('');
    setResetSent(false);
    setResetLoading(false);
    setErrors({});
    setMessage(null);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* DIP BLANCO (80px) de extremo a extremo, por encima del contenido */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white h-20 shadow-md flex items-center justify-center">
        <Image src="/assets/logo-blue.svg" alt="Academia de IA" width={140} height={32} />
      </div>

      {/* Panel izquierdo: imagen sin overlay; logo blanco centrado */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/assets/login-bg.png"
          alt="Mujer trabajando con laptop - Academia de IA"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center px-12">
          <Image
            src="/assets/logo-white.svg"
            alt="Academia de IA"
            width={240}
            height={60}
            className="mb-0"
          />
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* spacer to not stay under the header on mobile */}
          <div className="lg:hidden h-24" />

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Title: "Inicio de " normal + "Session" bold (both black) */}
            <h2 className="text-2xl mb-6 text-center">
              <span className="font-normal text-black">Inicio de </span>
              <span className="font-semibold text-black">Sesión</span>
            </h2>

            {/* Messages */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
                role="alert"
                aria-live="polite"
              >
                {message.text}
              </div>
            )}
            {errors.general && (
              <div
                className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200"
                role="alert"
                aria-live="polite"
              >
                {errors.general}
              </div>
            )}

            {!showReset ? (
              <>
                <form onSubmit={onEmailLogin} noValidate className="space-y-4">
                  <input
                    aria-label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // clear specific error when typing
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      // clear general message if any
                      if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
                    }}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    placeholder="Email"
                    autoComplete="email"
                    className="block w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                  <input
                    aria-label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
                    }}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    className="block w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.password && (
                    <p id="password-error" role="alert" className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                  <Button
                    type="submit"
                    aria-busy={loading ? 'true' : 'false'}
                    disabled={loading || googleLoading}
                    className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-[#0000FF] text-white hover:bg-blue-700 focus:ring-blue-500 text-base px-6 py-3 w-full"
                  >
                    Iniciar sesión
                  </Button>
                </form>

                {/* Separador */}
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-gray-300" />
                  <div className="mx-4 text-sm text-gray-500">o</div>
                  <div className="flex-1 border-t border-gray-300" />
                </div>

                {/* Google */}
                <Button
                  variant="outline"
                  size="lg"
                  loading={googleLoading}
                  disabled={loading}
                  onClick={onGoogle}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="currentColor"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="currentColor"
                    />
                  </svg>
                  Iniciar con Google
                </Button>

                {/* Recuperar */}
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReset(true);
                      setResetEmail(email);
                    }}
                    className="text-sm text-[#0000FF] hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    disabled={loading || googleLoading}
                  >
                    ¿Se te olvidó tu contraseña?
                  </button>
                </div>

                {/* Registro */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    ¿No tienes una cuenta?{' '}
                    <button
                      type="button"
                      className="text-[#0000FF] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      disabled={loading || googleLoading}
                    >
                      Regístrate
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Reset */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={resetView}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    disabled={resetLoading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver al inicio de sesión
                  </button>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-4">Recuperar contraseña</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                {!resetSent ? (
                  <form className="space-y-4" onSubmit={onSendReset}>
                    <input
                      type="email"
                      placeholder="Email"
                      aria-label="Email"
                      autoComplete="email"
                      className="block w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <Button type="submit" variant="primary" size="lg" loading={resetLoading} className="w-full">
                      Enviar enlace de recuperación
                    </Button>
                  </form>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      ¡Listo! Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    </p>
                    <Button variant="outline" size="md" onClick={resetView}>
                      Volver al inicio de sesión
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
