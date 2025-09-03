import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  startAt,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  Query
} from 'firebase/firestore';
import { db } from '../firebase';
import { Sale } from '../types';

export type SortDirection = 'asc' | 'desc';

export type SortableField = 
  | 'customerName' 
  | 'customerEmail' 
  | 'productName' 
  | 'vendorName' 
  | 'date' 
  | 'paymentMethod' 
  | 'usdAmount' 
  | 'status';

export interface SalesQueryFilters {
  text?: string;
  productId?: string;
  vendorId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: SortableField;
  sortDir?: SortDirection;
}

export interface PaginationOptions {
  pageSize: number;
  cursor?: QueryDocumentSnapshot<DocumentData>;
  direction?: 'next' | 'prev';
}

export interface SalesPage {
  sales: Sale[];
  nextCursor?: QueryDocumentSnapshot<DocumentData>;
  prevCursor?: QueryDocumentSnapshot<DocumentData>;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalCount?: number;
}

export interface SaleRow {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  vendorName: string;
  saleDate: Timestamp;
  saleDateISO: string;
  paymentMethod: string;
  amountUsd: number;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Build a Firestore query based on filters
 */
export function buildSalesQuery(filters: SalesQueryFilters): Query<DocumentData> {
  const salesRef = collection(db, 'sales');
  let q = query(salesRef);
  

  // To completely avoid composite index requirements, we'll use minimal queries
  // and handle most filtering client-side
  
  const sortField = filters.sortBy || 'date';
  const sortDirection = filters.sortDir || 'desc';
  
  // Map frontend field names to Firestore field names
  const fieldMap: Record<SortableField, string> = {
    customerName: 'customerName',
    customerEmail: 'customerEmail', 
    productName: 'productName',
    vendorName: 'vendorName',
    date: 'date',
    paymentMethod: 'paymentMethod',
    usdAmount: 'usdAmount',
    status: 'status'
  };

  // Only apply sorting if no filters are present, OR if we're only filtering by the same field we're sorting by
  const hasFilters = !!(filters.status || filters.productId || filters.vendorId || filters.dateFrom || filters.dateTo);
  
  if (!hasFilters) {
    // No filters - safe to sort
    q = query(q, orderBy(fieldMap[sortField], sortDirection));
  } else if (filters.status && sortField === 'status') {
    // Filtering and sorting by status - single field index
    q = query(q, where('status', '==', filters.status), orderBy('status', sortDirection));
  } else if (filters.status) {
    // Only filter by status, no sorting
    q = query(q, where('status', '==', filters.status));
  } else {
    // For other filters, just sort by a basic field to ensure consistent ordering
    q = query(q, orderBy('date', 'desc'));
  }

  return q;
}

/**
 * Client-side filter to apply additional filters that weren't applied at database level
 */
function applyClientFilters(sales: Sale[], filters: SalesQueryFilters): Sale[] {
  let filtered = sales;

  // Apply text search filter
  if (filters.text) {
    filtered = filterSalesByText(filtered, filters.text);
  }

  // Apply all filters client-side (except status which might be applied at DB level)
  if (filters.productId) {
    filtered = filtered.filter(sale => sale.productId === filters.productId);
  }

  if (filters.vendorId) {
    filtered = filtered.filter(sale => sale.vendorId === filters.vendorId);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(sale => {
      const saleDate = sale.date instanceof Timestamp ? sale.date.toDate() : new Date(sale.date as string | Date);
      return saleDate >= filters.dateFrom!;
    });
  }

  if (filters.dateTo) {
    filtered = filtered.filter(sale => {
      const saleDate = sale.date instanceof Timestamp ? sale.date.toDate() : new Date(sale.date as string | Date);
      return saleDate <= filters.dateTo!;
    });
  }

  // Apply client-side sorting if needed
  const sortField = filters.sortBy || 'date';
  const sortDirection = filters.sortDir || 'desc';
  const hasFilters = !!(filters.status || filters.productId || filters.vendorId || filters.dateFrom || filters.dateTo);
  
  if (hasFilters && !(filters.status && sortField === 'status')) {
    // Need to sort client-side
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;
      
      switch (sortField) {
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'customerEmail':
          aValue = a.customerEmail;
          bValue = b.customerEmail;
          break;
        case 'productName':
          aValue = a.productName;
          bValue = b.productName;
          break;
        case 'vendorName':
          aValue = a.vendorName;
          bValue = b.vendorName;
          break;
        case 'date':
          aValue = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date as string | Date);
          bValue = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date as string | Date);
          break;
        case 'paymentMethod':
          aValue = a.paymentMethod;
          bValue = b.paymentMethod;
          break;
        case 'usdAmount':
          aValue = a.usdAmount;
          bValue = b.usdAmount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return filtered;
}

/**
 * Fetch a page of sales data
 */
export async function fetchSalesPage(
  filters: SalesQueryFilters,
  pagination: PaginationOptions
): Promise<SalesPage> {
  try {
    let q = buildSalesQuery(filters);
    
    // Apply pagination cursor
    if (pagination.cursor) {
      if (pagination.direction === 'prev') {
        q = query(q, startAt(pagination.cursor), limit(pagination.pageSize));
      } else {
        q = query(q, startAfter(pagination.cursor), limit(pagination.pageSize));
      }
    } else {
      q = query(q, limit(pagination.pageSize));
    }

    const snapshot = await getDocs(q);
    let sales: Sale[] = [];
    
    snapshot.forEach(doc => {
      sales.push({
        id: doc.id,
        ...doc.data()
      } as Sale);
    });

    // Apply additional client-side filters
    sales = applyClientFilters(sales, filters);

    // Get cursors for pagination
    const firstDoc = snapshot.docs[0];
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return {
      sales,
      nextCursor: lastDoc,
      prevCursor: firstDoc,
      hasNextPage: snapshot.docs.length === pagination.pageSize,
      hasPrevPage: !!pagination.cursor,
    };
  } catch (error) {
    console.error('Error fetching sales page:', error);
    // Log composite index requirements if needed
    if (error instanceof Error && error.message.includes('index')) {
      console.warn('Firestore composite index may be required. Check console for index creation link.');
    }
    throw error;
  }
}

/**
 * Filter sales by text search (client-side filtering for now)
 * This is because Firestore doesn't support full-text search natively
 */
export function filterSalesByText(sales: Sale[], searchText: string): Sale[] {
  if (!searchText.trim()) return sales;
  
  const text = searchText.toLowerCase();
  return sales.filter(sale => 
    sale.customerName.toLowerCase().includes(text) ||
    sale.customerEmail.toLowerCase().includes(text)
  );
}

/**
 * Convert Sale to SaleRow for table display
 */
export function saleToRow(sale: Sale): SaleRow {
  // Handle both Timestamp objects and already converted Date objects
  let saleDate: Timestamp;
  let dateObject: Date;
  
  try {
    if (sale.date instanceof Timestamp) {
      saleDate = sale.date;
    } else {
      // Handle various date formats
      const inputDate = sale.date as string | Date;
      const parsedDate = new Date(inputDate);
      
      if (isNaN(parsedDate.getTime())) {
        // If parsing fails, use current date as fallback
        console.warn('Invalid date found in sale:', sale.id, 'date:', sale.date);
        parsedDate.setTime(Date.now());
      }
      
      saleDate = Timestamp.fromDate(parsedDate);
    }
    
    dateObject = saleDate.toDate();
    
    // Verify the date is valid
    if (isNaN(dateObject.getTime())) {
      throw new Error('Invalid date object');
    }
  } catch (error) {
    console.error('Error processing date for sale:', sale.id, error);
    // Fallback to current date
    saleDate = Timestamp.now();
    dateObject = new Date();
  }
  
  return {
    id: sale.id,
    customerName: sale.customerName,
    customerEmail: sale.customerEmail,
    productName: sale.productName,
    vendorName: sale.vendorName,
    saleDate: saleDate,
    saleDateISO: dateObject.toISOString().split('T')[0],
    paymentMethod: sale.paymentMethod,
    amountUsd: sale.usdAmount,
    status: sale.status,
  };
}

/**
 * Fetch all sales for export (respecting filters)
 */
export async function fetchAllSalesForExport(
  filters: SalesQueryFilters,
  maxRows: number = 10000
): Promise<SaleRow[]> {
  const allSales: Sale[] = [];
  let cursor: QueryDocumentSnapshot<DocumentData> | undefined;
  const pageSize = 1000; // Large page size for export
  
  try {
    while (allSales.length < maxRows) {
      const page = await fetchSalesPage(filters, {
        pageSize: Math.min(pageSize, maxRows - allSales.length),
        cursor,
        direction: cursor ? 'next' : undefined,
      });
      
      // Apply text filtering if needed (client-side)
      let pageSales = page.sales;
      if (filters.text) {
        pageSales = filterSalesByText(pageSales, filters.text);
      }
      
      allSales.push(...pageSales);
      
      if (!page.hasNextPage || pageSales.length === 0) {
        break;
      }
      
      cursor = page.nextCursor;
    }
    
    return allSales.map(saleToRow);
  } catch (error) {
    console.error('Error fetching all sales for export:', error);
    throw error;
  }
}

/**
 * Get sales statistics for KPI cards
 */
export async function getSalesStats(filters: Pick<SalesQueryFilters, 'dateFrom' | 'dateTo'>): Promise<{
  pendingCount: number;
  approvedCount: number;
  pendingAmount: number;
  approvedAmount: number;
}> {
  try {
    // Get pending sales
    const pendingStats = await fetchSalesPage(
      { ...filters, status: 'pending' },
      { pageSize: 10000 }
    );

    // Get approved sales  
    const approvedStats = await fetchSalesPage(
      { ...filters, status: 'approved' },
      { pageSize: 10000 }
    );

    const pendingAmount = pendingStats.sales.reduce((sum, sale) => sum + sale.usdAmount, 0);
    const approvedAmount = approvedStats.sales.reduce((sum, sale) => sum + sale.usdAmount, 0);

    return {
      pendingCount: pendingStats.sales.length,
      approvedCount: approvedStats.sales.length,
      pendingAmount,
      approvedAmount,
    };
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    return {
      pendingCount: 0,
      approvedCount: 0, 
      pendingAmount: 0,
      approvedAmount: 0,
    };
  }
}