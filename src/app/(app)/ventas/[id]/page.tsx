'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '../../../../components/ui/Breadcrumb';
import Toast from '../../../../components/ui/Toast';
import { fetchSaleById } from '../../../../lib/sales/query';
import { updateSaleStatus, addSaleComment } from '../../../../lib/firestore/sales';
import { formatDate, formatCurrency } from '../../../../lib/utils/csvExport';
import { getSaleStatusLabel } from '../../../../lib/utils/saleStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Sale } from '../../../../lib/types';
import { Timestamp } from 'firebase/firestore';

interface SaleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SaleDetailPage({ params }: SaleDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { vendor, isAdmin, isSeller } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    async function loadSale() {
      try {
        const saleData = await fetchSaleById(id);
        setSale(saleData);
      } catch (error) {
        console.error('Error loading sale:', error);
        setToast({
          message: 'Error loading sale details',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    }

    loadSale();
  }, [id]);

  const handleAddComment = async () => {
    if (!sale || !comment.trim() || !vendor) return;
    
    setAddingComment(true);
    try {
      await addSaleComment(sale.id, {
        message: comment.trim(),
        createdBy: vendor.id,
        createdByName: vendor.name
      });
      
      // Reload sale to get updated comments
      const updatedSale = await fetchSaleById(sale.id);
      setSale(updatedSale);
      setComment('');
      
      setToast({
        message: 'Comentario agregado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setToast({
        message: 'Error al agregar comentario',
        type: 'error'
      });
    } finally {
      setAddingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: 'approved' | 'rejected' | 'pending') => {
    if (!sale) return;
    
    setUpdatingStatus(true);
    try {
      await updateSaleStatus(sale.id, newStatus);
      setSale(prev => prev ? { ...prev, status: newStatus } : null);
      
      setToast({
        message: 'Estado actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({
        message: 'Error al actualizar el estado',
        type: 'error'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading sale details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Sale not found</div>
            <button
              onClick={() => router.push('/ventas')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Sales
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Escritorio', href: '/dashboard' },
              { label: 'Ventas', href: '/ventas' },
              { label: 'Registro de venta' },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl text-gray-900 mb-2">
            Registro <span className="font-semibold">de venta</span>
          </h1>
          <p className="text-blue-600 text-sm">
            Vendedor: <span className="font-bold">{sale.vendorName}</span>
          </p>
          
          {/* Status Display */}
          <div className="mt-6">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              sale.status === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : sale.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {getSaleStatusLabel(sale.status)}
            </span>
          </div>
        </div>

        {/* Form-like display matching sales form UI */}
        <div className="space-y-6">
          {/* Row 1: Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Name */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Nombre de cliente</div>
                <div className="font-medium">{sale.customerName}</div>
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Correo</div>
                <div className="font-medium">{sale.customerEmail}</div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Teléfono</div>
                <div className="font-medium">{sale.customerPhone || 'No proporcionado'}</div>
              </div>
            </div>
          </div>

          {/* Row 2: Product, Sale Value, Currency, Sale Date, USD Amount */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Product */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Producto (SCK)</div>
                <div className="font-medium text-sm">{sale.productName}</div>
              </div>
            </div>

            {/* Sale Value */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Valor de venta</div>
                <div className="font-medium">{formatCurrency(sale.amount)}</div>
              </div>
            </div>

            {/* Currency */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Moneda</div>
                <div className="font-medium">{sale.currency}</div>
              </div>
            </div>

            {/* Sale Date */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Fecha de venta</div>
                <div className="font-medium">
                  {formatDate(sale.date instanceof Timestamp ? sale.date.toDate() : new Date(sale.date as string | Date))}
                </div>
              </div>
            </div>

            {/* USD Amount */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Valor en USD</div>
                <div className="font-medium">{formatCurrency(sale.usdAmount)} USD</div>
              </div>
            </div>
          </div>

          {/* Row 3: Payment Method, Source, Week, Iteration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Payment Method */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Forma de pago</div>
                <div className="font-medium">{sale.paymentMethod}</div>
              </div>
            </div>

            {/* Source */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Procedencia</div>
                <div className="font-medium">{sale.source}</div>
              </div>
            </div>

            {/* Week */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Semana</div>
                <div className="font-medium">{sale.week}</div>
              </div>
            </div>

            {/* Iteration */}
            <div>
              <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                <div className="text-xs text-gray-500 mb-1">Iteración</div>
                <div className="font-medium">{sale.iteration}</div>
              </div>
            </div>
          </div>

          {/* Evidence Section */}
          {(sale.evidenceType || sale.evidenceValue) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Evidence Type */}
              {sale.evidenceType && (
                <div>
                  <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                    <div className="text-xs text-gray-500 mb-1">Tipo de evidencia</div>
                    <div className="font-medium">{sale.evidenceType}</div>
                  </div>
                </div>
              )}

              {/* Evidence Value */}
              {sale.evidenceValue && (
                <div>
                  <div className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg text-[#4A739C]">
                    <div className="text-xs text-gray-500 mb-1">Evidencia de la transacción</div>
                    <div className="font-medium">
                      {sale.evidenceType === 'url' ? (
                        <a 
                          href={sale.evidenceValue} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600"
                        >
                          {sale.evidenceValue}
                        </a>
                      ) : (
                        sale.evidenceValue
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Group Users List - Only for group sales */}
          {sale.type === 'group' && sale.users && sale.users.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Usuarios del grupo</h3>
              {sale.users.map((user, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg text-[#4A739C]">
                      <div className="text-xs text-gray-500 mb-1">Nombre</div>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </div>
                  <div>
                    <div className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg text-[#4A739C]">
                      <div className="text-xs text-gray-500 mb-1">Correo</div>
                      <div className="font-medium">{user.email}</div>
                    </div>
                  </div>
                  {user.phone && (
                    <div>
                      <div className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg text-[#4A739C]">
                        <div className="text-xs text-gray-500 mb-1">Teléfono</div>
                        <div className="font-medium">{user.phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comments Section */}
          {sale.comments && sale.comments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Comentarios</h3>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comentario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sale.comments.map((comment) => (
                      <tr key={comment.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {comment.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {comment.createdByName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt as string | Date))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comments Section - Available for everyone */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {isAdmin ? "Gestión de venta" : "Agregar comentario"}
            </h3>
            
            {/* Add Comment Section */}
            <div className="space-y-4">
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  {isAdmin ? "Dejar nota al vendedor" : "Agregar comentario"}
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-800"
                  placeholder="Escriba su comentario aquí..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setComment('')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim() || addingComment}
                  className="px-4 py-2 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {addingComment ? 'Agregando...' : 'Comentar'}
                </button>
              </div>
            </div>

            {/* Status Change Buttons - Only for admins and pending sales */}
            {isAdmin && sale.status === 'pending' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Cambiar estado de la venta</h4>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    disabled={updatingStatus}
                    className="px-6 py-2 border border-transparent rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Denegar
                  </button>
                  <button
                    onClick={() => handleStatusChange('approved')}
                    disabled={updatingStatus}
                    className="px-6 py-2 border border-transparent rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            )}
          </div>
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