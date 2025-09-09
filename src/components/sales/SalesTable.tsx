'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, MoreHorizontal, Eye, Edit, CheckCircle } from 'lucide-react';
import { SaleRow, SortableField, SortDirection } from '../../lib/sales/query';
import { formatDate, formatCurrency } from '../../lib/utils/csvExport';
import { getSaleStatusLabel } from '../../lib/utils/saleStatus';
import { updateSaleStatusWithComment, addSaleComment } from '../../lib/firestore/sales';
import { useAuth } from '@/contexts/AuthContext';
import StatusChangeModal from './StatusChangeModal';
import AddCommentModal from './AddCommentModal';

interface SalesTableProps {
  sales: SaleRow[];
  sortBy?: SortableField;
  sortDir?: SortDirection;
  onSortChange: (field: SortableField) => void;
  onDataChange?: () => void; // Callback to refresh data after changes
  loading?: boolean;
}

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

export default function SalesTable({ 
  sales, 
  sortBy, 
  sortDir, 
  onSortChange,
  onDataChange,
  loading = false 
}: SalesTableProps) {
  const router = useRouter();
  const { vendor, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [statusChangeModal, setStatusChangeModal] = useState<{ isOpen: boolean; saleId?: string; customerName?: string }>({ isOpen: false });
  const [addCommentModal, setAddCommentModal] = useState<{ isOpen: boolean; saleId?: string; customerName?: string }>({ isOpen: false });
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleDropdownToggle = (saleId: string) => {
    setDropdownOpen(dropdownOpen === saleId ? null : saleId);
  };


  const handleViewDetail = (saleId: string) => {
    router.push(`/ventas/${saleId}`);
    setDropdownOpen(null);
  };

  const handleStatusChange = (saleId: string, customerName: string) => {
    setStatusChangeModal({ isOpen: true, saleId, customerName });
    setDropdownOpen(null);
  };

  const handleAddComment = (saleId: string, customerName: string) => {
    setAddCommentModal({ isOpen: true, saleId, customerName });
    setDropdownOpen(null);
  };

  const handleStatusChangeSubmit = async (status: 'approved' | 'rejected', comment: string) => {
    if (!statusChangeModal.saleId || !vendor) {
      throw new Error('Missing required data');
    }

    try {
      await updateSaleStatusWithComment(statusChangeModal.saleId, status, {
        message: comment,
        createdBy: vendor.id,
        createdByName: vendor.name
      });
      
      // Refresh data if callback provided
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error updating sale status:', error);
      throw error;
    }
  };

  const handleAddCommentSubmit = async (comment: string) => {
    if (!addCommentModal.saleId || !vendor) {
      throw new Error('Missing required data');
    }

    try {
      await addSaleComment(addCommentModal.saleId, {
        message: comment,
        createdBy: vendor.id,
        createdByName: vendor.name
      });
      
      // Refresh data if callback provided
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };
  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No sales match the selected filters.</div>
          <div className="text-gray-400 text-sm mt-2">Try adjusting your search criteria.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                field="customerName"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              >
                Nombre Cliente
              </SortableHeader>
              
              <SortableHeader
                field="customerEmail"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              >
                Correo
              </SortableHeader>
              
              <SortableHeader
                field="productName"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              >
                Producto
              </SortableHeader>
              
              <SortableHeader
                field="vendorName"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              >
                Vendedor
              </SortableHeader>
              
              <SortableHeader
                field="date"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              >
                Fecha de venta
              </SortableHeader>
              
              <SortableHeader
                field="paymentMethod"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              >
                Forma de pago
              </SortableHeader>
              
              <SortableHeader
                field="usdAmount"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
                className="text-right"
              >
                Valor
              </SortableHeader>
              
              <SortableHeader
                field="status"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              >
                Estado de la venta
              </SortableHeader>
              
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale, index) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sale.customerName}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.customerEmail}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.productName}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.vendorName}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(sale.saleDate.toDate())}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.paymentMethod}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatCurrency(sale.amountUsd)} USD
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    sale.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : sale.status === 'approved'
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {getSaleStatusLabel(sale.status)}
                  </span>
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <button
                    type="button"
                    onClick={() => handleDropdownToggle(sale.id)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={`More actions for ${sale.customerName}`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  
                  {dropdownOpen === sale.id && (
                    <div 
                      ref={dropdownRef} 
                      className={`absolute right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 ${
                        index >= Math.max(3, sales.length - 2) 
                          ? 'bottom-full mb-1' 
                          : 'top-full mt-1'
                      }`}
                    >
                      <div className="py-1">
                        <button
                          onClick={() => handleViewDetail(sale.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalle
                        </button>
                        
                        {/* Status change option - only for pending sales and admins */}
                        {sale.status === 'pending' && isAdmin && (
                          <button
                            onClick={() => handleStatusChange(sale.id, sale.customerName)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Cambiar estatus
                          </button>
                        )}
                        
                        {/* Add comment option - for all sales */}
                        <button
                          onClick={() => handleAddComment(sale.id, sale.customerName)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Agregar comentario
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={statusChangeModal.isOpen}
        onClose={() => setStatusChangeModal({ isOpen: false })}
        onSubmit={handleStatusChangeSubmit}
        customerName={statusChangeModal.customerName || ''}
      />
      
      {/* Add Comment Modal */}
      <AddCommentModal
        isOpen={addCommentModal.isOpen}
        onClose={() => setAddCommentModal({ isOpen: false })}
        onSubmit={handleAddCommentSubmit}
        customerName={addCommentModal.customerName || ''}
      />
    </div>
  );
}