'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: 'approved' | 'rejected', comment: string) => Promise<void>;
  customerName: string;
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  onSubmit,
  customerName
}: StatusChangeModalProps) {
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('El comentario es requerido');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(status, comment.trim());
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar el estatus');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatus('approved');
    setComment('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Cambiar Estatus</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Cambiar estatus para: <span className="font-medium text-gray-900">{customerName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Estatus
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="approved"
                  checked={status === 'approved'}
                  onChange={(e) => setStatus(e.target.value as 'approved')}
                  disabled={loading}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Aprobar</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="rejected"
                  checked={status === 'rejected'}
                  onChange={(e) => setStatus(e.target.value as 'rejected')}
                  disabled={loading}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Rechazar</span>
              </label>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Comentario *
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900"
              placeholder="Escriba su comentario sobre el cambio de estatus..."
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className={
                status === 'approved' 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }
            >
              {status === 'approved' ? 'Aprobar Venta' : 'Rechazar Venta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}