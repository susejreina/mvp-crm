import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import IndividualSaleForm from '../../../../../components/sales/IndividualSaleForm';
import { Sale } from '../../../../../lib/types';

// Mock Firebase functions
vi.mock('../../../../../lib/firestore/clients', () => ({
  getActiveClients: vi.fn(),
  resolveClientForSale: vi.fn(),
  updateClient: vi.fn(),
}));

vi.mock('../../../../../lib/firestore/sales', () => ({
  createSale: vi.fn(),
  getProducts: vi.fn(),
  getSourcesData: vi.fn(),
  getPaymentMethodsData: vi.fn(),
  getEvidenceTypesData: vi.fn(),
  getWeekNumber: vi.fn(),
  validateSaleValue: vi.fn(),
  validateEvidenceValue: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

import {
  getActiveClients,
  resolveClientForSale,
  updateClient,
} from '../../../../../lib/firestore/clients';

import {
  createSale,
  getProducts,
  getSourcesData,
  getPaymentMethodsData,
  getEvidenceTypesData,
  getWeekNumber,
  validateSaleValue,
  validateEvidenceValue,
} from '../../../../../lib/firestore/sales';

// Mock data
const mockClients = [
  {
    id: 'john-doe-example-com',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    active: true,
    createdAt: { toMillis: () => Date.now() },
  },
  {
    id: 'jane-smith-example-com',
    name: 'Jane Smith', 
    email: 'jane.smith@example.com',
    active: true,
    createdAt: { toMillis: () => Date.now() },
  },
];

const mockProducts = [
  {
    id: 'ai-course-basic',
    name: 'AI Course Basic',
    sku: 'AI-001',
    active: true,
    baseCurrency: 'USD',
    basePrice: 99,
    createdAt: { toMillis: () => Date.now() },
  },
  {
    id: 'ai-course-advanced',
    name: 'AI Course Advanced',
    sku: 'AI-002', 
    active: false,
    baseCurrency: 'USD',
    basePrice: 299,
    createdAt: { toMillis: () => Date.now() },
  },
];

const mockSources = [
  { id: 'referral', name: 'Referral' },
  { id: 'social-media', name: 'Social Media' },
];

const mockPaymentMethods = [
  { id: 'transfer_mx', name: 'Bank Transfer (MX)' },
  { id: 'card', name: 'Credit Card' },
];

const mockEvidenceTypes = [
  { id: 'url', name: 'URL' },
  { id: 'transaction_number', name: 'Transaction Number' },
];

describe('IndividualSaleForm', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Setup default mock implementations
    vi.mocked(getActiveClients).mockResolvedValue(mockClients);
    vi.mocked(getProducts).mockResolvedValue(mockProducts);
    vi.mocked(getSourcesData).mockResolvedValue(mockSources);
    vi.mocked(getPaymentMethodsData).mockResolvedValue(mockPaymentMethods);
    vi.mocked(getEvidenceTypesData).mockResolvedValue(mockEvidenceTypes);
    vi.mocked(getWeekNumber).mockReturnValue(42);
    vi.mocked(validateSaleValue).mockReturnValue({ 
      isValid: true, 
      normalizedValue: 100 
    });
    vi.mocked(validateEvidenceValue).mockReturnValue({ isValid: true });
    vi.mocked(resolveClientForSale).mockResolvedValue({
      client: mockClients[0],
    });
    vi.mocked(createSale).mockResolvedValue({
      id: 'test-sale-id',
      type: 'individual',
      clientId: 'john-doe-example-com',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
    } as Sale);
    vi.mocked(updateClient).mockResolvedValue();
  });

  test('renders form with all required fields', async () => {
    render(<IndividualSaleForm />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    });

    // Check all required fields are present
    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sale value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sale date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/week/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/iteration/i)).toBeInTheDocument();
  });

  test('fetches only active clients for autocomplete', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(getActiveClients).toHaveBeenCalledTimes(1);
    });
  });

  test('shows client suggestions when typing', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    });

    const clientInput = screen.getByLabelText(/client name/i);
    
    // Type to trigger autocomplete
    fireEvent.change(clientInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  test('autofills email and phone when selecting existing client', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    });

    const clientInput = screen.getByLabelText(/client name/i);
    fireEvent.change(clientInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on the suggestion
    fireEvent.click(screen.getByText('John Doe'));

    // Check that fields are autofilled
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
  });

  test('shows confirmation modal when email is changed for existing client', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    });

    // Select existing client
    const clientInput = screen.getByLabelText(/client name/i);
    fireEvent.change(clientInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    // Change the email
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'john.new@example.com' } });

    // Fill other required fields
    await fillRequiredFields();

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register sale/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirm email change/i)).toBeInTheDocument();
    });
  });

  test('validates sale value input', async () => {
    vi.mocked(validateSaleValue).mockReturnValue({
      isValid: false,
      error: 'Only numbers, dots, and commas are allowed',
    });

    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/sale value/i)).toBeInTheDocument();
    });

    const saleValueInput = screen.getByLabelText(/sale value/i);
    
    // Try to enter invalid characters
    fireEvent.change(saleValueInput, { target: { value: 'abc' } });

    // The input should not change (validation prevents it)
    expect(saleValueInput.value).toBe('');

    // Now try valid input
    fireEvent.change(saleValueInput, { target: { value: '100.50' } });
    expect(saleValueInput.value).toBe('100.50');
  });

  test('validates evidence field based on type', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/evidence type/i)).toBeInTheDocument();
    });

    // Select URL type
    const evidenceTypeSelect = screen.getByLabelText(/evidence type/i);
    fireEvent.change(evidenceTypeSelect, { target: { value: 'url' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    });

    // Mock URL validation failure
    vi.mocked(validateEvidenceValue).mockReturnValue({
      isValid: false,
      error: 'Invalid URL format',
    });

    await fillRequiredFields();

    // Fill invalid URL
    const urlInput = screen.getByLabelText(/url/i);
    fireEvent.change(urlInput, { target: { value: 'not-a-url' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register sale/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    });
  });

  test('calculates week number from sale date', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/sale date/i)).toBeInTheDocument();
    });

    const saleDateInput = screen.getByLabelText(/sale date/i);
    fireEvent.change(saleDateInput, { target: { value: '2024-01-15' } });

    // Week should be auto-calculated
    expect(getWeekNumber).toHaveBeenCalled();
  });

  test('successfully creates sale with correct data', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    });

    // Fill all required fields
    await fillRequiredFields();

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register sale/i }));

    await waitFor(() => {
      expect(resolveClientForSale).toHaveBeenCalled();
      expect(createSale).toHaveBeenCalled();
      expect(updateClient).toHaveBeenCalled();
    });

    // Check that createSale was called with correct structure
    expect(createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: expect.any(String),
        customerEmail: expect.any(String),
        productId: expect.any(String),
        amount: expect.any(Number),
        currency: expect.any(String),
        date: expect.any(Date),
      })
    );
  });

  test('shows loading state while saving', async () => {
    // Make createSale take a long time
    vi.mocked(createSale).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    });

    await fillRequiredFields();

    const submitButton = screen.getByRole('button', { name: /register sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/saving sale/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  test('displays error when required fields are missing', async () => {
    render(<IndividualSaleForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /register sale/i })).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /register sale/i }));

    await waitFor(() => {
      expect(screen.getByText(/client name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/product is required/i)).toBeInTheDocument();
    });
  });

  // Helper function to fill all required fields
  async function fillRequiredFields() {
    const clientNameInput = screen.getByLabelText(/client name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const productSelect = screen.getByLabelText(/product/i);
    const saleValueInput = screen.getByLabelText(/sale value/i);
    const currencySelect = screen.getByLabelText(/currency/i);
    const paymentMethodSelect = screen.getByLabelText(/payment method/i);
    const sourceSelect = screen.getByLabelText(/source/i);
    const weekInput = screen.getByLabelText(/week/i);
    const iterationInput = screen.getByLabelText(/iteration/i);

    fireEvent.change(clientNameInput, { target: { value: 'Test Client' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(productSelect, { target: { value: 'ai-course-basic' } });
    fireEvent.change(saleValueInput, { target: { value: '100' } });
    fireEvent.change(currencySelect, { target: { value: 'USD' } });
    fireEvent.change(paymentMethodSelect, { target: { value: 'transfer_mx' } });
    fireEvent.change(sourceSelect, { target: { value: 'referral' } });
    fireEvent.change(weekInput, { target: { value: '1' } });
    fireEvent.change(iterationInput, { target: { value: '1' } });

    await waitFor(() => {
      expect(clientNameInput.value).toBe('Test Client');
    });
  }
});