'use client';

import { useState, useEffect, useCallback } from 'react';
import { Metadata } from 'next';
import { useSearchParams, useRouter } from 'next/navigation';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import SalesFilters from '../../../components/sales/SalesFilters';
import SalesKPIs from '../../../components/sales/SalesKPIs';
import SalesTable from '../../../components/sales/SalesTable';
import Pagination from '../../../components/sales/Pagination';
import { 
  SalesQueryFilters, 
  SortableField, 
  SortDirection,
  fetchSalesPage,
  getSalesStats,
  fetchAllSalesForExport,
  saleToRow,
  filterSalesByText
} from '../../../lib/sales/query';
import { exportSalesToCSV } from '../../../lib/utils/csvExport';
import { getProducts } from '../../../lib/firestore/sales';
import { getActiveClients } from '../../../lib/firestore/clients';
import { Product, Client } from '../../../lib/types';

export const metadata: Metadata = {
  title: 'Registro de Ventas | Academia de IA CRM',
  description: 'Gestiona y visualiza todas las ventas con filtros, paginación y exportación a CSV',
};

export default function SalesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Client[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    pendingAmount: 0,
    approvedAmount: 0
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [cursors, setCursors] = useState<{
    [key: number]: QueryDocumentSnapshot<DocumentData>
  }>({});

  // Get initial state from URL
  const getFiltersFromURL = (): SalesQueryFilters => {
    return {
      text: searchParams.get('search') || undefined,
      productId: searchParams.get('product') || undefined,
      vendorId: searchParams.get('vendor') || undefined,
      status: searchParams.get('status') as any || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      sortBy: (searchParams.get('sortBy') as SortableField) || 'date',
      sortDir: (searchParams.get('sortDir') as SortDirection) || 'desc'
    };
  };

  const [filters, setFilters] = useState<SalesQueryFilters>(getFiltersFromURL());

  // Update URL when filters change
  const updateURL = useCallback((newFilters: SalesQueryFilters, page: number = 1, newPageSize: number = pageSize) => {
    const params = new URLSearchParams();
    
    if (newFilters.text) params.set('search', newFilters.text);
    if (newFilters.productId) params.set('product', newFilters.productId);
    if (newFilters.vendorId) params.set('vendor', newFilters.vendorId);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom.toISOString().split('T')[0]);
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo.toISOString().split('T')[0]);
    if (newFilters.sortBy && newFilters.sortBy !== 'date') params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortDir && newFilters.sortDir !== 'desc') params.set('sortDir', newFilters.sortDir);
    if (page > 1) params.set('page', page.toString());
    if (newPageSize !== 25) params.set('pageSize', newPageSize.toString());

    router.replace(`/sales?${params.toString()}`);
  }, [router, pageSize]);

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [productsData, vendorsData] = await Promise.all([
          getProducts(),
          getActiveClients()
        ]);
        
        setProducts(productsData.filter(p => p.active));
        setVendors(vendorsData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }
    
    loadInitialData();
  }, []);

  // Load sales data
  const loadSales = useCallback(async (
    newFilters: SalesQueryFilters, 
    page: number = 1, 
    newPageSize: number = pageSize
  ) => {
    setLoading(true);
    try {
      // Get cursor for the page
      const cursor = page > 1 ? cursors[page - 1] : undefined;
      
      const result = await fetchSalesPage(newFilters, {
        pageSize: newPageSize,
        cursor,
        direction: cursor ? 'next' : undefined
      });

      // Apply text filtering client-side if needed
      let salesData = result.sales;
      if (newFilters.text) {
        salesData = filterSalesByText(salesData, newFilters.text);
      }

      setSales(salesData);
      setHasNextPage(result.hasNextPage);
      setHasPrevPage(page > 1);

      // Update cursors
      if (result.nextCursor) {
        setCursors(prev => ({ ...prev, [page]: result.nextCursor! }));
      }

      // Load stats
      const statsData = await getSalesStats({
        dateFrom: newFilters.dateFrom,
        dateTo: newFilters.dateTo
      });
      setStats(statsData);

    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize, cursors]);

  // Load data when filters change
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1');
    const urlPageSize = parseInt(searchParams.get('pageSize') || '25');
    
    setCurrentPage(urlPage);
    setPageSize(urlPageSize);
    
    loadSales(filters, urlPage, urlPageSize);
  }, [filters, searchParams, loadSales]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: SalesQueryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setCursors({}); // Reset cursors when filters change
    updateURL(newFilters, 1, pageSize);
  };

  // Handle sorting
  const handleSortChange = (field: SortableField) => {
    const currentSort = filters.sortBy;
    const currentDir = filters.sortDir;
    
    let newDir: SortDirection | undefined;
    
    if (currentSort === field) {
      // Cycle through: asc -> desc -> none (back to default)
      if (currentDir === 'asc') {
        newDir = 'desc';
      } else if (currentDir === 'desc') {
        // Reset to default
        field = 'date';
        newDir = 'desc';
      } else {
        newDir = 'asc';
      }
    } else {
      newDir = 'asc';
    }

    const newFilters = {
      ...filters,
      sortBy: field,
      sortDir: newDir
    };
    
    handleFiltersChange(newFilters);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setCursors({}); // Reset cursors when page size changes
    updateURL(filters, 1, newPageSize);
  };

  // Handle CSV export
  const handleExport = async () => {
    setExporting(true);
    try {
      const allSales = await fetchAllSalesForExport(filters);
      exportSalesToCSV(allSales);
    } catch (error) {
      console.error('Error exporting sales:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const salesRows = sales.map(saleToRow);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Escritorio', href: '/dashboard' },
              { label: 'Ventas' },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl text-gray-900">
            Registro <span className="font-semibold">de ventas</span>
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <SalesFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            products={products}
            vendors={vendors}
            exporting={exporting}
            loading={loading}
          />
        </div>

        {/* KPIs */}
        <SalesKPIs
          pendingCount={stats.pendingCount}
          approvedCount={stats.approvedCount}
          pendingAmount={stats.pendingAmount}
          approvedAmount={stats.approvedAmount}
          loading={loading}
        />

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <SalesTable
            sales={salesRows}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            loading={loading}
          />
          
          {/* Pagination */}
          {salesRows.length > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}