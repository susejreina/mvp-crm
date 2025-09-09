// src/lib/auth/errors.ts

export class AuthServiceError extends Error {
  readonly title: string;
  readonly code?: string;

  constructor(params: { code?: string; title: string; message: string }) {
    super(params.message);
    this.name = 'AuthServiceError';
    this.title = params.title;
    this.code = params.code;
  }
}

type Mapped = { title: string; message: string };

export function mapFirebaseAuthError(err: unknown): Mapped {
  // Many tests/mocks don't create real FirebaseError, so we take .code if it exists
  const code = (err as { code?: string })?.code;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        title: 'Credenciales inválidas',
        message:
          'El email o la contraseña son incorrectos. Verifica tus datos e intenta de nuevo.',
      };

    case 'auth/invalid-email':
      return {
        title: 'Email inválido',
        message: 'El formato del correo no es válido. Revisa e intenta nuevamente.',
      };

    case 'auth/popup-closed-by-user':
      return {
        title: 'Inicio de sesión cancelado',
        message: 'Cerraste la ventana de Google antes de completar el inicio de sesión.',
      };

    case 'auth/popup-blocked':
      return {
        title: 'Ventana emergente bloqueada',
        message:
          'El navegador bloqueó la ventana de Google. Habilita las ventanas emergentes e inténtalo otra vez.',
      };

    case 'auth/too-many-requests':
      return {
        title: 'Demasiados intentos',
        message:
          'Se detectaron demasiados intentos. Espera unos minutos antes de volver a intentar.',
      };

    // Add other error codes you want to map explicitly

    default:
      return {
        title: 'Error inesperado',
        message: 'Ocurrió un error inesperado. Intenta nuevamente más tarde.',
      };
  }
}
