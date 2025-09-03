'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Loader2 } from 'lucide-react';
import { SalesQueryFilters } from '../../lib/sales/query';
import { Product, Client } from '../../lib/types';
import { getSaleStatusOptions } from '../../lib/utils/saleStatus';

interface SalesFiltersProps {
  filters: SalesQueryFilters;
  onFiltersChange: (filters: SalesQueryFilters) => void;
  onExport: () => void;
  products: Product[];
  vendors: Client[];
  exporting?: boolean;
  loading?: boolean;
}

export default function SalesFilters({
  filters,
  onFiltersChange,
  onExport,
  products,
  vendors,
  exporting = false,
  loading = false
}: SalesFiltersProps) {
  const [searchText, setSearchText] = useState(filters.text || '');

  // Debounce search text
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, text: searchText || undefined });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const handleFilterChange = (key: keyof SalesQueryFilters, value: string | Date | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const statusOptions = getSaleStatusOptions();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Busca por nombre o correo"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="text-sm font-medium text-gray-700">Filtros:</div>

        {/* Date range */}
        <div className="flex items-center space-x-2">
          <label htmlFor="date-from" className="text-sm text-gray-600">
            Filtrar por fecha
          </label>
          <input
            id="date-from"
            type="date"
            value={formatDateForInput(filters.dateFrom)}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            id="date-to"
            type="date"
            value={formatDateForInput(filters.dateTo)}
            onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Product filter */}
        <select
          value={filters.productId || ''}
          onChange={(e) => handleFilterChange('productId', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Producto</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        {/* Vendor filter */}
        <select
          value={filters.vendorId || ''}
          onChange={(e) => handleFilterChange('vendorId', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Vendedor</option>
          {vendors.map(vendor => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Estado</option>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Export button */}
        <button
          onClick={onExport}
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
  );
}