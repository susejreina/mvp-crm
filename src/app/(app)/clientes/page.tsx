'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Loader2, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Toast from '../../../components/ui/Toast';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/sales/Pagination';
import { getAllClients } from '../../../lib/firestore/clients';
import { Client } from '../../../lib/types';
import { formatDate } from '../../../lib/utils/csvExport';
import { Timestamp } from 'firebase/firestore';

interface ClientRow extends Client {
  expanded?: boolean;
}

type SortableField = 'name' | 'email' | 'phone' | 'createdAt' | 'lastPurchaseAt' | 'active';
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

export default function ClientesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientRow[]>([]);
  const [paginatedClients, setPaginatedClients] = useState<ClientRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortableField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter, sort and paginate clients
  useEffect(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Handle timestamp fields
      if (sortBy === 'createdAt' || sortBy === 'lastPurchaseAt') {
        aValue = aValue instanceof Timestamp ? aValue.toDate() : new Date(aValue);
        bValue = bValue instanceof Timestamp ? bValue.toDate() : new Date(bValue);
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

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDir === 'desc' ? -result : result;
    });

    setFilteredClients(filtered);

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedClients(filtered.slice(startIndex, endIndex));
  }, [clients, searchTerm, sortBy, sortDir, currentPage, pageSize]);

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
    
    router.replace(`/clientes?${params.toString()}`);
  }, [router, searchTerm, sortBy, sortDir, currentPage, pageSize]);

  const loadClients = async () => {
    try {
      const clientsData = await getAllClients();
      const clientsWithExpanded = clientsData.map(client => ({
        ...client,
        expanded: false
      }));
      setClients(clientsWithExpanded);
    } catch (error) {
      console.error('Error loading clients:', error);
      setToast({
        message: 'Error al cargar clientes',
        type: 'error',
      });
    } finally {
      setLoading(false);
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

  const toggleClientExpansion = (clientId: string) => {
    // Update all state arrays
    setClients(prev => 
      prev.map(client => 
        client.id === clientId 
          ? { ...client, expanded: !client.expanded }
          : client
      )
    );
  };

  const exportClientsToCSV = () => {
    const csvContent = [
      // Headers
      ['Nombre', 'Correo', 'Teléfono', 'Estado', 'Fecha de Registro', 'Última Compra'].join(','),
      // Data rows
      ...filteredClients.map(client => [
        `"${client.name}"`,
        `"${client.email}"`,
        `"${client.phone || ''}"`,
        client.active ? 'Activo' : 'Inactivo',
        `"${formatDate(client.createdAt instanceof Timestamp ? client.createdAt.toDate() : new Date(client.createdAt as string | Date))}"`,
        client.lastPurchaseAt ? `"${formatDate(client.lastPurchaseAt instanceof Timestamp ? client.lastPurchaseAt.toDate() : new Date(client.lastPurchaseAt as string | Date))}"` : '""'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="ml-3 text-gray-600">Cargando clientes...</span>
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
              { label: 'Clientes' },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl text-gray-900">
            Registro <span className="font-semibold">de clientes</span>
          </h1>
          <button
            onClick={exportClientsToCSV}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar datos
          </button>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="max-w-md">
            <Input
              placeholder="Buscar por nombre, correo o teléfono"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Clients Table */}
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
                    Nombre Cliente
                  </SortableHeader>
                  
                  <SortableHeader
                    field="email"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Correo
                  </SortableHeader>
                  
                  <SortableHeader
                    field="phone"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Teléfono
                  </SortableHeader>
                  
                  <SortableHeader
                    field="createdAt"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Fecha de registro
                  </SortableHeader>
                  
                  <SortableHeader
                    field="lastPurchaseAt"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                  >
                    Última compra
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
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      {searchTerm
                        ? 'No se encontraron clientes que coincidan con la búsqueda.'
                        : 'No hay clientes registrados.'}
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedClients.map((client) => (
                      <React.Fragment key={client.id}>
                        {/* Main client row */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              {client.users && client.users.length > 0 && (
                                <button
                                  onClick={() => toggleClientExpansion(client.id)}
                                  className="mr-2 p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {client.expanded ? (
                                    <Minus className="h-4 w-4 text-gray-600" />
                                  ) : (
                                    <Plus className="h-4 w-4 text-gray-600" />
                                  )}
                                </button>
                              )}
                              {client.name}
                            </div>
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.email}
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.phone || '-'}
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(client.createdAt instanceof Timestamp ? client.createdAt.toDate() : new Date(client.createdAt as string | Date))}
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.lastPurchaseAt 
                              ? formatDate(client.lastPurchaseAt instanceof Timestamp ? client.lastPurchaseAt.toDate() : new Date(client.lastPurchaseAt as string | Date))
                              : '-'
                            }
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {client.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded users rows */}
                        {client.expanded && client.users && client.users.map((user, index) => (
                          <tr key={`user-${client.id}-${index}`} className="bg-blue-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              <div className="ml-6 text-blue-800 font-medium">
                                {user.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700">
                              {user.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700">
                              {user.phone || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              -
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              -
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Usuario
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredClients.length > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={filteredClients.length}
              hasNextPage={currentPage * pageSize < filteredClients.length}
              hasPrevPage={currentPage > 1}
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
    </div>
  );
}