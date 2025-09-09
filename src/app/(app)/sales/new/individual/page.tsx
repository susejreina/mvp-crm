'use client';

import { useState } from 'react';
import IndividualSaleForm from '../../../../../components/sales/IndividualSaleForm';
import Breadcrumb from '../../../../../components/ui/Breadcrumb';
import Toast from '../../../../../components/ui/Toast';

export default function IndividualSalePage() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Escritorio', href: '/dashboard' },
              { label: 'Nueva venta' },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl text-gray-900">
            Registrar <span className="font-semibold">Nueva Venta</span>
          </h1>
        </div>

        {/* Form */}
        <IndividualSaleForm onSuccess={(message) => setToast({ message, type: 'success' })} />
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