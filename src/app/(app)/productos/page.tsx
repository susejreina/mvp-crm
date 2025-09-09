'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Button from '../../../components/ui/Button';
import Toast from '../../../components/ui/Toast';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/sales/Pagination';
import AddProductModal from '../../../components/products/AddProductModal';
import { getProducts, createProduct } from '../../../lib/firestore/sales';
import { Product } from '../../../lib/types';
import { formatDate, formatCurrency } from '../../../lib/utils/csvExport';
import { Timestamp } from 'firebase/firestore';

type SortableField = 'name' | 'sku' | 'basePrice' | 'baseCurrency' | 'createdAt' | 'active';
type SortDirection = 'asc' | 'desc';

interface SortableHeaderProps {
  field: SortableField;
  children: React.ReactNode;
  sortBy?: SortableField;
  sortDir?: SortDirection;
  onSortChange: (field: SortableField) => void;
  className?: string;
}

function SortableHeader({ 
  field, 
  children, 
  sortBy, 
  sortDir, 
  onSortChange, 
  className = '' 
}: SortableHeaderProps) {
  const isActive = sortBy === field;
  
  const getAriaSort = () => {
    if (!isActive) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 select-none ${className}`}
      onClick={() => onSortChange(field)}
      role="columnheader"
      aria-sort={getAriaSort()}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSortChange(field);
        }
      }}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${
              isActive && sortDir === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              isActive && sortDir === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </th>
  );
}

export default function ProductosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortableField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Get initial state from URL
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const sort = (searchParams.get('sortBy') as SortableField) || 'name';
    const dir = (searchParams.get('sortDir') as SortDirection) || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('pageSize') || '25');
    
    setSearchTerm(search);
    setSortBy(sort);
    setSortDir(dir);
    setCurrentPage(page);
    setPageSize(size);
  }, [searchParams]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter, sort and paginate products
  useEffect(() => {
    let filtered = products;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: unknown = a[sortBy];
      let bValue: unknown = b[sortBy];

      // Handle timestamp fields
      if (sortBy === 'createdAt') {
        aValue = aValue instanceof Timestamp ? aValue.toDate() : new Date(aValue as string | Date);
        bValue = bValue instanceof Timestamp ? bValue.toDate() : new Date(bValue as string | Date);
      }

      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let result = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        result = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        result = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        result = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        result = Number(aValue) - Number(bValue);
      } else {
        result = String(aValue).localeCompare(String(bValue));
      }
      return sortDir === 'desc' ? -result : result;
    });

    setFilteredProducts(filtered);

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedProducts(filtered.slice(startIndex, endIndex));
  }, [products, searchTerm, sortBy, sortDir, currentPage, pageSize]);

  // Update URL with all filters
  const updateURL = useCallback((updates: {
    search?: string;
    sortBy?: SortableField;
    sortDir?: SortDirection;
    page?: number;
    pageSize?: number;
  }) => {
    const params = new URLSearchParams();
    
    const search = updates.search !== undefined ? updates.search : searchTerm;
    const sort = updates.sortBy || sortBy;
    const dir = updates.sortDir || sortDir;
    const page = updates.page || currentPage;
    const size = updates.pageSize || pageSize;
    
    if (search) params.set('search', search);
    if (sort !== 'name') params.set('sortBy', sort);
    if (dir !== 'asc') params.set('sortDir', dir);
    if (page > 1) params.set('page', page.toString());
    if (size !== 25) params.set('pageSize', size.toString());
    
    router.replace(`/productos?${params.toString()}`);
  }, [router, searchTerm, sortBy, sortDir, currentPage, pageSize]);

  const loadProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      setToast({
        message: 'Error al cargar productos',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData: {
    name: string;
    sku: string;
    baseCurrency: 'USD' | 'MXN' | 'COP';
    basePrice: number;
  }) => {
    try {
      const result = await createProduct(productData);
      
      if (result.success) {
        await loadProducts(); // Reload products list
        setShowAddModal(false);
        setToast({
          message: 'Producto agregado correctamente',
          type: 'success',
        });
      }
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      setToast({
        message: (error as Error).message || 'Error al agregar producto',
        type: 'error',
      });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
    updateURL({ search: value, page: 1 });
  };

  const handleSortChange = (field: SortableField) => {
    const newDir = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortDir(newDir);
    setCurrentPage(1); // Reset to first page
    updateURL({ sortBy: field, sortDir: newDir, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
    updateURL({ pageSize: size, page: 1 });
  };

  const exportProductsToCSV = () => {
    const csvContent = [
      // Headers
      ['Nombre', 'SKU', 'Precio Base', 'Moneda', 'Estado', 'Fecha de Creación'].join(','),
      // Data rows
      ...filteredProducts.map(product => [
        `"${product.name}"`,
        `"${product.sku}"`,
        product.basePrice.toString(),
        `"${product.baseCurrency}"`,
        product.active ? 'Activo' : 'Inactivo',
        `"${formatDate(product.createdAt instanceof Timestamp ? product.createdAt.toDate() : new Date(product.createdAt as string | Date))}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando productos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Escritorio', href: '/dashboard' },
              { label: 'Productos' },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl text-gray-900">
            Registro <span className="font-semibold">de productos</span>
          </h1>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddModal(true)} className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
            <button
              onClick={exportProductsToCSV}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar datos
            </button>
          </div>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="max-w-md">
            <Input
              placeholder="Buscar por nombre o SKU"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="table">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader
                    field="name"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Nombre del Producto
                  </SortableHeader>
                  
                  <SortableHeader
                    field="sku"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    SKU
                  </SortableHeader>
                  
                  <SortableHeader
                    field="basePrice"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Precio Base
                  </SortableHeader>
                  
                  <SortableHeader
                    field="baseCurrency"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Moneda
                  </SortableHeader>
                  
                  <SortableHeader
                    field="createdAt"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Fecha de Creación
                  </SortableHeader>
                  
                  <SortableHeader
                    field="active"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Estado
                  </SortableHeader>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      {searchTerm
                        ? 'No se encontraron productos que coincidan con la búsqueda.'
                        : 'No hay productos registrados.'}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.sku}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(product.basePrice)}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.baseCurrency}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(product.createdAt instanceof Timestamp ? product.createdAt.toDate() : new Date(product.createdAt as string | Date))}
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={filteredProducts.length}
              hasNextPage={currentPage * pageSize < filteredProducts.length}
              hasPrevPage={currentPage > 1}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddProduct}
        />
      )}
      
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}