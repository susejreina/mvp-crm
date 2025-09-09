'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Download, Loader2 } from 'lucide-react';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Toast from '../../../components/ui/Toast';
import SalesFilters from '../../../components/sales/SalesFilters';
import SalesKPIs from '../../../components/sales/SalesKPIs';
import SalesTable from '../../../components/sales/SalesTable';
import Pagination from '../../../components/sales/Pagination';
import SaleKindModal from '../../../components/sales/SaleKindModal';
import { 
  SalesQueryFilters, 
  SortableField, 
  SortDirection,
  fetchSalesPage,
  getSalesStats,
  fetchAllSalesForExport,
  saleToRow
} from '../../../lib/sales/query';
import { exportSalesToCSV } from '../../../lib/utils/csvExport';
import { getProducts } from '../../../lib/firestore/sales';
import { getActiveVendors } from '../../../lib/firestore/vendors';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Sale, Vendor } from '../../../lib/types';

export default function VentasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vendor, isAdmin, isSeller } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
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
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const cursorsRef = useRef<{
    [key: number]: QueryDocumentSnapshot<DocumentData>
  }>({});

  // Get initial state from URL
  const getFiltersFromURL = useCallback((): SalesQueryFilters => {
    const filters: SalesQueryFilters = {
      text: searchParams.get('search') || undefined,
      productId: searchParams.get('product') || undefined,
      vendorId: searchParams.get('vendor') || undefined,
      status: (searchParams.get('status') as 'pending' | 'approved' | 'rejected') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      sortBy: (searchParams.get('sortBy') as SortableField) || 'date',
      sortDir: (searchParams.get('sortDir') as SortDirection) || 'desc'
    };

    // If user is seller, force their vendorId filter
    if (isSeller && vendor) {
      filters.vendorId = vendor.id;
    }

    return filters;
  }, [searchParams, isSeller, vendor]);

  const [filters, setFilters] = useState<SalesQueryFilters>({});
  
  // Initialize filters when vendor is available
  useEffect(() => {
    if (vendor) {
      setFilters(getFiltersFromURL());
    }
  }, [vendor, searchParams, getFiltersFromURL]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: SalesQueryFilters, page: number = 1, newPageSize: number = pageSize) => {
    const params = new URLSearchParams();
    
    if (newFilters.text) params.set('search', newFilters.text);
    if (newFilters.productId) params.set('product', newFilters.productId);
    // Only include vendor filter in URL for admins (sellers have it forced)
    if (newFilters.vendorId && isAdmin) params.set('vendor', newFilters.vendorId);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom.toISOString().split('T')[0]);
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo.toISOString().split('T')[0]);
    if (newFilters.sortBy && newFilters.sortBy !== 'date') params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortDir && newFilters.sortDir !== 'desc') params.set('sortDir', newFilters.sortDir);
    if (page > 1) params.set('page', page.toString());
    if (newPageSize !== 25) params.set('pageSize', newPageSize.toString());

    router.replace(`/ventas?${params.toString()}`);
  }, [router, pageSize, isAdmin]);

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [productsData, vendorsData] = await Promise.all([
          getProducts(),
          getActiveVendors()
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
      const cursor = page > 1 ? cursorsRef.current[page - 1] : undefined;
      
      const result = await fetchSalesPage(newFilters, {
        pageSize: newPageSize,
        cursor,
        direction: cursor ? 'next' : undefined
      });

      // Text filtering is now handled in fetchSalesPage
      setSales(result.sales);
      setHasNextPage(result.hasNextPage);
      setHasPrevPage(page > 1);

      // Update cursors
      if (result.nextCursor) {
        cursorsRef.current = { ...cursorsRef.current, [page]: result.nextCursor };
      }

      // Load stats
      const statsData = await getSalesStats({
        dateFrom: newFilters.dateFrom,
        dateTo: newFilters.dateTo
      });
      
      // Ensure all stats are numbers
      setStats({
        pendingCount: Number(statsData.pendingCount) || 0,
        approvedCount: Number(statsData.approvedCount) || 0,
        pendingAmount: Number(statsData.pendingAmount) || 0,
        approvedAmount: Number(statsData.approvedAmount) || 0,
      });

    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

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
    // For sellers, always keep their vendorId
    if (isSeller && vendor) {
      newFilters.vendorId = vendor.id;
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
    cursorsRef.current = {}; // Reset cursors when filters change
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
    cursorsRef.current = {}; // Reset cursors when page size changes
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
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl text-gray-900">
            Registro <span className="font-semibold">de ventas</span>
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span className="text-lg mr-2">+</span>
              Nueva venta
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exporting ? 'Exportando...' : 'Exportar datos'}
            </button>
          </div>
        </div>

        {/* Filters and KPIs */}
        <div className="mb-6 flex gap-6">
          {/* Filters - 60% width */}
          <div className="flex-[0_0_60%]">
            <SalesFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              products={products}
              vendors={vendors}
              loading={loading}
              showVendorFilter={isAdmin}
            />
          </div>
          
          {/* KPIs - 40% width */}
          <div className="flex-[0_0_40%] flex gap-4">
            <div className="flex-1">
              <SalesKPIs
                pendingCount={stats.pendingCount}
                approvedCount={stats.approvedCount}
                pendingAmount={stats.pendingAmount}
                approvedAmount={stats.approvedAmount}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <SalesTable
            sales={salesRows}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onDataChange={() => loadSales(filters, currentPage, pageSize)}
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
      
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Sale Kind Modal */}
      <SaleKindModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  );
}