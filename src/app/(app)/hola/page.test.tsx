import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authService, AuthServiceError } from '@/lib/auth/service';
import HolaPage from './page';

// Mock for authentication service
vi.mock('@/lib/auth/service', () => ({
  authService: {
    signOut: vi.fn(),
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

describe('HolaPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado inicial', () => {
    it('should render welcome message and sign out button', () => {
      render(<HolaPage />);

      expect(screen.getByText('¡Hola, Director!')).toBeInTheDocument();
      expect(screen.getByText(/bienvenido a tu plataforma de ventas/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
      expect(screen.getByText(/esta es una pantalla placeholder/i)).toBeInTheDocument();
      expect(screen.getByText('👋')).toBeInTheDocument();
    });
  });

  describe('Sign Out functionality', () => {
    it('should call signOut when button is clicked', async () => {
      vi.mocked(authService.signOut).mockResolvedValue();

      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(signOutButton);

      expect(authService.signOut).toHaveBeenCalled();
    });

    it('should redirect to login after successful sign out', async () => {
      vi.mocked(authService.signOut).mockResolvedValue();

      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });

    it('should show loading state during sign out', async () => {
      let resolveSignOut: () => void;
      vi.mocked(authService.signOut).mockImplementation(
        () => new Promise((resolve) => { resolveSignOut = resolve; })
      );

      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(signOutButton);

      expect(signOutButton).toHaveAttribute('aria-busy', 'true');
      expect(signOutButton).toBeDisabled();

      resolveSignOut!();

      await waitFor(() => {
        expect(signOutButton).not.toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should show error message if sign out fails', async () => {
      vi.mocked(authService.signOut).mockRejectedValue(
        new AuthServiceError('Error de cierre', 'No se pudo cerrar la sesión')
      );

      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(screen.getByText('No se pudo cerrar la sesión')).toBeInTheDocument();
      });

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('should handle unknown errors during sign out', async () => {
      vi.mocked(authService.signOut).mockRejectedValue(new Error('Network error'));

      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(screen.getByText('No se pudo cerrar la sesión. Intenta de nuevo.')).toBeInTheDocument();
      });

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should display error message with proper ARIA attributes', async () => {
      vi.mocked(authService.signOut).mockRejectedValue(
        new AuthServiceError('Error de cierre', 'No se pudo cerrar la sesión')
      );

      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(signOutButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('No se pudo cerrar la sesión');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should allow retry after error', async () => {
      vi.mocked(authService.signOut)
        .mockRejectedValueOnce(new AuthServiceError('Error temporal', 'Error temporal'))
        .mockResolvedValueOnce();

      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      
      // First attempt - should fail
      await user.click(signOutButton);

      await waitFor(() => {
        expect(screen.getByText('Error temporal')).toBeInTheDocument();
      });

      // Second attempt - should succeed
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });

      expect(authService.signOut).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button attributes', () => {
      render(<HolaPage />);

      const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      expect(signOutButton).toBeInTheDocument();
      expect(signOutButton).not.toBeDisabled();
    });

    it('should have proper semantic structure', () => {
      render(<HolaPage />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('¡Hola, Director!');
    });
  });
});