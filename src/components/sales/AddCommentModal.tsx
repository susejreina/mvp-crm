'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

interface AddCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
  customerName: string;
}

export default function AddCommentModal({
  isOpen,
  onClose,
  onSubmit,
  customerName
}: AddCommentModalProps) {
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
      await onSubmit(comment.trim());
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar el comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
          <h2 className="text-lg font-semibold text-gray-900">Agregar Comentario</h2>
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
            Agregar comentario para: <span className="font-medium text-gray-900">{customerName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Escriba su comentario..."
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
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            >
              Agregar Comentario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}