'use client';

import { useRouter } from 'next/navigation';
import { User, Users, X } from 'lucide-react';

interface SaleKindModalProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}

export default function SaleKindModal({ open, onOpenChange }: SaleKindModalProps) {
  const router = useRouter();

  const handleOptionSelect = (route: string) => {
    onOpenChange(false);
    router.push(route);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Tipo de venta
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Individual Option */}
          <button
            onClick={() => handleOptionSelect('/sales/new/individual')}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-medium text-gray-900">Individual</h3>
                <p className="text-sm text-gray-500">Venta para un solo cliente</p>
              </div>
            </div>
          </button>

          {/* Group Option */}
          <button
            onClick={() => handleOptionSelect('/sales/new/group')}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-medium text-gray-900">Grupal</h3>
                <p className="text-sm text-gray-500">Venta para múltiples clientes</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}