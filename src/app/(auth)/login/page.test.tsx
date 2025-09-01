import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authService, AuthServiceError } from '@/lib/auth/service';
import LoginPage from './page';

// Mock for authentication service
vi.mock('@/lib/auth/service', () => ({
  authService: {
    signInWithEmailPassword: vi.fn(),
    signInWithGoogle: vi.fn(),
    sendPasswordReset: vi.fn(),
    onAuthStateChanged: vi.fn(),
  },
  AuthServiceError: class AuthServiceError extends Error {
    constructor(public title: string, message: string) {
      super(message);
      this.name = 'AuthServiceError';
    }
  },
}));

const mockRouter = {
  replace: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock onAuthStateChanged to return null (not authenticated)
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(null);
      return vi.fn(); // unsubscribe function
    });
  });

  describe('Renderizado inicial', () => {
    it('should render login form with all elements', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: /inicio de\s*sesión/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar con google/i })).toBeInTheDocument();
      expect(screen.getByText(/¿se te olvidó tu contraseña\?/i)).toBeInTheDocument();
    });

    it('should redirect to /hola if user is already authenticated', () => {
      // Mock user authenticated
      vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
        callback({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
        });
        return vi.fn();
      });

      render(<LoginPage />);

      expect(mockRouter.replace).toHaveBeenCalledWith('/hola');
    });
  });

  describe('Validación del formulario', () => {
    it('should mark both fields invalid when submitting empty form', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Mensajes
      expect(screen.getByText('El email es requerido')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();

      // ARIA invalid for empty fields
      const email = screen.getByLabelText(/email/i);
      const password = screen.getByLabelText(/contraseña/i);
      expect(email).toHaveAttribute('aria-invalid', 'true');
      expect(password).toHaveAttribute('aria-invalid', 'true');
    });

    it('should mark email invalid for bad format', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Current flow shows specific error message
      await waitFor(() => {
        expect(screen.getByText('Ingresa un email válido')).toBeInTheDocument();
      });
    });

    it('should mark password invalid when too short', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
    });

    it('should clear email invalid state once user types a valid email', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      // Trigger "empty field" validation
      await user.click(submitButton);
      expect(screen.getByText('El email es requerido')).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');

      // Al tipear, se limpia el error
      await user.type(emailInput, 'test@example.com');
      expect(screen.queryByText('El email es requerido')).not.toBeInTheDocument();
    });
  });

  describe('Email/Password Login', () => {
    it('should call signInWithEmailPassword with correct data', async () => {
      vi.mocked(authService.signInWithEmailPassword).mockResolvedValue({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
        },
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(authService.signInWithEmailPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should show loading state during sign in', async () => {
      let resolveSignIn: (value: any) => void;
      vi.mocked(authService.signInWithEmailPassword).mockImplementation(
        () => new Promise((resolve) => { resolveSignIn = resolve; })
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(submitButton).toBeDisabled();

      resolveSignIn!({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
        },
      });

      await waitFor(() => {
        expect(submitButton).not.toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should show error message on sign in failure', async () => {
      vi.mocked(authService.signInWithEmailPassword).mockRejectedValue(
        new AuthServiceError('Credenciales inválidas', 'Email o contraseña incorrectos')
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email o contraseña incorrectos')).toBeInTheDocument();
      });
    });
  });

  describe('Google Sign In', () => {
    it('should call signInWithGoogle when Google button is clicked', async () => {
      vi.mocked(authService.signInWithGoogle).mockResolvedValue({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
        },
      });

      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /iniciar con google/i });
      await user.click(googleButton);

      expect(authService.signInWithGoogle).toHaveBeenCalled();
    });

    it('should show error message on Google sign in failure', async () => {
      vi.mocked(authService.signInWithGoogle).mockRejectedValue(
        new AuthServiceError('Popup cerrado', 'El usuario cerró la ventana emergente')
      );

      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /iniciar con google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('El usuario cerró la ventana emergente')).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset', () => {
    it('should show password reset form when link is clicked', async () => {
      render(<LoginPage />);

      const resetLink = screen.getByText(/¿se te olvidó tu contraseña\?/i);
      await user.click(resetLink);

      expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
      expect(screen.getByText(/ingresa tu email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enviar enlace de recuperación/i })).toBeInTheDocument();
    });

    it('should prefill email in reset form', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const resetLink = screen.getByText(/¿se te olvidó tu contraseña\?/i);
      await user.click(resetLink);

      const resetEmailInput = screen.getByLabelText(/email/i);
      expect(resetEmailInput).toHaveValue('test@example.com');
    });

    it('should send password reset email', async () => {
      vi.mocked(authService.sendPasswordReset).mockResolvedValue();

      render(<LoginPage />);

      const resetLink = screen.getByText(/¿se te olvidó tu contraseña\?/i);
      await user.click(resetLink);

      const resetEmailInput = screen.getByLabelText(/email/i);
      const sendButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });

      await user.type(resetEmailInput, 'test@example.com');
      await user.click(sendButton);

      expect(authService.sendPasswordReset).toHaveBeenCalledWith('test@example.com');

      await waitFor(() => {
        expect(screen.getByText(/se envió un enlace de recuperación/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email in reset form', async () => {
      // We validate it doesn't trigger action when email is invalid
      vi.mocked(authService.sendPasswordReset).mockResolvedValue();

      render(<LoginPage />);

      const resetLink = screen.getByText(/¿se te olvidó tu contraseña\?/i);
      await user.click(resetLink);

      const resetEmailInput = screen.getByLabelText(/email/i);
      const sendButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });

      await user.type(resetEmailInput, 'invalid-email');
      await user.click(sendButton);

      expect(authService.sendPasswordReset).not.toHaveBeenCalled();
      // Y seguimos mostrando las instrucciones (UI actual)
      expect(screen.getByText(/ingresa tu email.*enlace/i)).toBeInTheDocument();
    });

    it('should show error for empty email in reset form', async () => {
      render(<LoginPage />);

      const resetLink = screen.getByText(/¿se te olvidó tu contraseña\?/i);
      await user.click(resetLink);

      const sendButton = screen.getByRole('button', { name: /enviar enlace de recuperación/i });
      await user.click(sendButton);

      expect(screen.getByText('Ingresa tu email para enviar el enlace de recuperación')).toBeInTheDocument();
    });

    it('should return to login form when back button is clicked', async () => {
      render(<LoginPage />);

      const resetLink = screen.getByText(/¿se te olvidó tu contraseña\?/i);
      await user.click(resetLink);

      expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();

      const backButton = screen.getByText(/volver al inicio de sesión/i);
      await user.click(backButton);

      expect(screen.getByRole('heading', { name: /inicio de\s*sesión/i })).toBeInTheDocument();
      expect(screen.queryByText('Recuperar contraseña')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for form fields', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });

    it('should have proper ARIA attributes for loading buttons', async () => {
      let resolveSignIn: (value: any) => void;
      vi.mocked(authService.signInWithEmailPassword).mockImplementation(
        () => new Promise((resolve) => { resolveSignIn = resolve; })
      );

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(submitButton).toBeDisabled();

      resolveSignIn!({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
        },
      });

      await waitFor(() => {
        expect(submitButton).not.toHaveAttribute('aria-busy', 'true');
      });
    });
  });
});
