import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getTotalApprovedUsd, 
  getClientsCount, 
  getActiveProductsCount, 
  getSellersCount 
} from './queries';
import type { Firestore } from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  getCountFromServer: vi.fn(),
}));

describe('Dashboard Queries', () => {
  let mockDb: Firestore;
  let mockCollection: ReturnType<typeof vi.fn>;
  let mockQuery: ReturnType<typeof vi.fn>;
  let mockWhere: ReturnType<typeof vi.fn>;
  let mockGetDocs: ReturnType<typeof vi.fn>;
  let mockGetCountFromServer: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = {} as Firestore;
    
    const firestore = await import('firebase/firestore');
    mockCollection = vi.mocked(firestore.collection);
    mockQuery = vi.mocked(firestore.query);
    mockWhere = vi.mocked(firestore.where);
    mockGetDocs = vi.mocked(firestore.getDocs);
    mockGetCountFromServer = vi.mocked(firestore.getCountFromServer);
  });

  describe('getTotalApprovedUsd', () => {
    it('should calculate total approved USD sales', async () => {
      const mockSales = [
        { data: () => ({ amount: 100 }) },
        { data: () => ({ amount: 200 }) },
        { data: () => ({ amount: 300 }) },
      ];

      mockCollection.mockReturnValue('sales-collection');
      mockWhere.mockReturnValue('where-condition');
      mockQuery.mockReturnValue('query-result');
      mockGetDocs.mockResolvedValue({
        forEach: (callback: (doc: { data: () => { amount: number } }) => void) => mockSales.forEach(callback)
      });

      const result = await getTotalApprovedUsd(mockDb);

      expect(result).toBe(600);
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'sales');
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'approved');
      expect(mockWhere).toHaveBeenCalledWith('currency', '==', 'USD');
    });

    it('should throw error when query fails', async () => {
      mockCollection.mockReturnValue('sales-collection');
      mockQuery.mockReturnValue('query-result');
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(getTotalApprovedUsd(mockDb)).rejects.toThrow(
        'Failed to get total approved USD sales: Firestore error'
      );
    });
  });

  describe('getClientsCount', () => {
    it('should return clients count using getCountFromServer', async () => {
      mockCollection.mockReturnValue('clients-collection');
      mockGetCountFromServer.mockResolvedValue({
        data: () => ({ count: 42 })
      });

      const result = await getClientsCount(mockDb);

      expect(result).toBe(42);
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'clients');
      expect(mockGetCountFromServer).toHaveBeenCalled();
    });

    it('should fallback to getDocs when getCountFromServer fails', async () => {
      mockCollection.mockReturnValue('clients-collection');
      mockGetCountFromServer.mockRejectedValue(new Error('Count not available'));
      mockGetDocs.mockResolvedValue({ size: 25 });

      const result = await getClientsCount(mockDb);

      expect(result).toBe(25);
      expect(mockGetDocs).toHaveBeenCalled();
    });

    it('should throw error when both methods fail', async () => {
      mockCollection.mockReturnValue('clients-collection');
      mockGetCountFromServer.mockRejectedValue(new Error('Count not available'));
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      await expect(getClientsCount(mockDb)).rejects.toThrow(
        'Failed to get clients count: Firestore error'
      );
    });
  });

  describe('getActiveProductsCount', () => {
    it('should return active products count using getCountFromServer', async () => {
      mockCollection.mockReturnValue('products-collection');
      mockWhere.mockReturnValue('where-condition');
      mockQuery.mockReturnValue('query-result');
      mockGetCountFromServer.mockResolvedValue({
        data: () => ({ count: 15 })
      });

      const result = await getActiveProductsCount(mockDb);

      expect(result).toBe(15);
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'products');
      expect(mockWhere).toHaveBeenCalledWith('active', '==', true);
      expect(mockGetCountFromServer).toHaveBeenCalled();
    });

    it('should fallback to getDocs when getCountFromServer fails', async () => {
      mockCollection.mockReturnValue('products-collection');
      mockQuery.mockReturnValue('query-result');
      mockGetCountFromServer.mockRejectedValue(new Error('Count not available'));
      mockGetDocs.mockResolvedValue({ size: 10 });

      const result = await getActiveProductsCount(mockDb);

      expect(result).toBe(10);
      expect(mockGetDocs).toHaveBeenCalled();
    });
  });

  describe('getSellersCount', () => {
    it('should return active sellers count using getCountFromServer', async () => {
      mockCollection.mockReturnValue('vendors-collection');
      mockWhere.mockReturnValue('where-condition');
      mockQuery.mockReturnValue('query-result');
      mockGetCountFromServer.mockResolvedValue({
        data: () => ({ count: 6 })
      });

      const result = await getSellersCount(mockDb);

      expect(result).toBe(6);
      expect(mockCollection).toHaveBeenCalledWith(mockDb, 'vendors');
      expect(mockWhere).toHaveBeenCalledWith('role', '==', 'seller');
      expect(mockWhere).toHaveBeenCalledWith('active', '==', true);
      expect(mockGetCountFromServer).toHaveBeenCalled();
    });

    it('should fallback to getDocs when getCountFromServer fails', async () => {
      mockCollection.mockReturnValue('vendors-collection');
      mockQuery.mockReturnValue('query-result');
      mockGetCountFromServer.mockRejectedValue(new Error('Count not available'));
      mockGetDocs.mockResolvedValue({ size: 4 });

      const result = await getSellersCount(mockDb);

      expect(result).toBe(4);
      expect(mockGetDocs).toHaveBeenCalled();
    });
  });
});