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

  // Apply filters
  if (filters.productId) {
    q = query(q, where('productId', '==', filters.productId));
  }

  if (filters.vendorId) {
    q = query(q, where('vendorId', '==', filters.vendorId));
  }

  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom && filters.dateTo) {
      q = query(q, 
        where('date', '>=', Timestamp.fromDate(filters.dateFrom)),
        where('date', '<=', Timestamp.fromDate(filters.dateTo))
      );
    } else if (filters.dateFrom) {
      q = query(q, where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
    } else if (filters.dateTo) {
      q = query(q, where('date', '<=', Timestamp.fromDate(filters.dateTo)));
    }
  }

  // Apply sorting
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

  q = query(q, orderBy(fieldMap[sortField], sortDirection));

  return q;
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
    const sales: Sale[] = [];
    
    snapshot.forEach(doc => {
      sales.push({
        id: doc.id,
        ...doc.data()
      } as Sale);
    });

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
  return {
    id: sale.id,
    customerName: sale.customerName,
    customerEmail: sale.customerEmail,
    productName: sale.productName,
    vendorName: sale.vendorName,
    saleDate: sale.date,
    saleDateISO: sale.date.toDate().toISOString().split('T')[0],
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