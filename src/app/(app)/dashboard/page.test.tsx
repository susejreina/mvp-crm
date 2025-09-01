import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock dashboard queries
vi.mock('@/lib/dashboard/queries', () => ({
  getTotalApprovedUsd: vi.fn(),
  getClientsCount: vi.fn(),
  getActiveProductsCount: vi.fn(),
  getSellersCount: vi.fn(),
}));

describe('DashboardPage', () => {
  let mockQueries: typeof import('@/lib/dashboard/queries');

  beforeEach(async () => {
    vi.clearAllMocks();
    mockQueries = await import('@/lib/dashboard/queries');
  });

  it('should render dashboard with loading states initially', () => {
    // Mock queries to hang (never resolve) to test loading states
    vi.mocked(mockQueries.getTotalApprovedUsd).mockImplementation(() => new Promise(() => {}));
    vi.mocked(mockQueries.getClientsCount).mockImplementation(() => new Promise(() => {}));
    vi.mocked(mockQueries.getActiveProductsCount).mockImplementation(() => new Promise(() => {}));
    vi.mocked(mockQueries.getSellersCount).mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);

    expect(screen.getByText('Hola Angela Ojeda')).toBeInTheDocument();
    expect(screen.getByText('Director Comercial')).toBeInTheDocument();
    expect(screen.getByText('Añadir Nueva venta')).toBeInTheDocument();
    
    // Check for loading skeletons (animate-pulse elements)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render metrics when data is loaded successfully', async () => {
    vi.mocked(mockQueries.getTotalApprovedUsd).mockResolvedValue(230000);
    vi.mocked(mockQueries.getClientsCount).mockResolvedValue(235);
    vi.mocked(mockQueries.getActiveProductsCount).mockResolvedValue(15);
    vi.mocked(mockQueries.getSellersCount).mockResolvedValue(6);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$230,000.00')).toBeInTheDocument();
    });

    expect(screen.getByText('235')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    // Check for card titles
    expect(screen.getByText('Ventas totales manual')).toBeInTheDocument();
    expect(screen.getByText('Clientes totales')).toBeInTheDocument();
    expect(screen.getByText('Productos en venta')).toBeInTheDocument();
    expect(screen.getByText('Vendedores')).toBeInTheDocument();

    // Check for subtitles
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Comerciales')).toBeInTheDocument();
  });

  it('should render correct links', async () => {
    vi.mocked(mockQueries.getTotalApprovedUsd).mockResolvedValue(230000);
    vi.mocked(mockQueries.getClientsCount).mockResolvedValue(235);
    vi.mocked(mockQueries.getActiveProductsCount).mockResolvedValue(15);
    vi.mocked(mockQueries.getSellersCount).mockResolvedValue(6);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$230,000.00')).toBeInTheDocument();
    });

    // Check for links
    const newSaleLink = screen.getByRole('link', { name: /Añadir Nueva venta/ });
    expect(newSaleLink).toHaveAttribute('href', '/ventas/nueva');

    const viewVentasLink = screen.getByText('Ver ventas totales manual →');
    expect(viewVentasLink.closest('a')).toHaveAttribute('href', '/ventas');

    const viewVendedoresLink = screen.getByText('Ver vendedores →');
    expect(viewVendedoresLink.closest('a')).toHaveAttribute('href', '/vendedores');
  });

  it('should handle individual card errors gracefully', async () => {
    vi.mocked(mockQueries.getTotalApprovedUsd).mockRejectedValue(new Error('Failed to load sales'));
    vi.mocked(mockQueries.getClientsCount).mockResolvedValue(235);
    vi.mocked(mockQueries.getActiveProductsCount).mockResolvedValue(15);
    vi.mocked(mockQueries.getSellersCount).mockResolvedValue(6);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
    });

    // Other cards should still load successfully
    expect(screen.getByText('235')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('should format USD currency correctly', async () => {
    vi.mocked(mockQueries.getTotalApprovedUsd).mockResolvedValue(1234567.89);
    vi.mocked(mockQueries.getClientsCount).mockResolvedValue(235);
    vi.mocked(mockQueries.getActiveProductsCount).mockResolvedValue(15);
    vi.mocked(mockQueries.getSellersCount).mockResolvedValue(6);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
    });
  });

  it('should handle zero values correctly', async () => {
    vi.mocked(mockQueries.getTotalApprovedUsd).mockResolvedValue(0);
    vi.mocked(mockQueries.getClientsCount).mockResolvedValue(0);
    vi.mocked(mockQueries.getActiveProductsCount).mockResolvedValue(0);
    vi.mocked(mockQueries.getSellersCount).mockResolvedValue(0);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    expect(screen.getAllByText('0')).toHaveLength(3); // clients, products, vendors
  });
});