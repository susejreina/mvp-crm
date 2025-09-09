'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface AddProductModalProps {
  onClose: () => void;
  onSubmit: (product: {
    name: string;
    sku: string;
    baseCurrency: 'USD' | 'MXN' | 'COP';
    basePrice: number;
  }) => Promise<void>;
}

export default function AddProductModal({ onClose, onSubmit }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    baseCurrency: 'USD' as 'USD' | 'MXN' | 'COP',
    basePrice: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    sku?: string;
    baseCurrency?: string;
    basePrice?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const currencyOptions = [
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'MXN', label: 'MXN - Peso Mexicano' },
    { value: 'COP', label: 'COP - Peso Colombiano' },
  ];

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // SKU validation
    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    } else if (!/^[a-zA-Z0-9\-_]+$/.test(formData.sku)) {
      newErrors.sku = 'El SKU solo puede contener letras, números, guiones y guiones bajos';
    }

    // Currency validation
    if (!formData.baseCurrency) {
      newErrors.baseCurrency = 'La moneda es requerida';
    }

    // Price validation
    if (!formData.basePrice.trim()) {
      newErrors.basePrice = 'El precio es requerido';
    } else {
      const price = parseFloat(formData.basePrice);
      if (isNaN(price) || price <= 0) {
        newErrors.basePrice = 'Ingrese un precio válido mayor a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        baseCurrency: formData.baseCurrency,
        basePrice: parseFloat(formData.basePrice),
      });
      // Modal will be closed by parent component after successful submission
    } catch {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Agregar Producto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <Input
              label="Nombre del Producto"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Ingrese el nombre del producto"
              required
            />
          </div>

          {/* SKU Field */}
          <div>
            <Input
              label="SKU"
              type="text"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              error={errors.sku}
              placeholder="ej: chatgpt-live-workshop"
              required
              helperText="Código único del producto (solo letras, números, guiones y guiones bajos)"
            />
          </div>

          {/* Currency Field */}
          <div>
            <Select
              label="Moneda"
              options={currencyOptions}
              value={formData.baseCurrency}
              onChange={(e) => handleInputChange('baseCurrency', e.target.value as 'USD' | 'MXN' | 'COP')}
              error={errors.baseCurrency}
              required
            />
          </div>

          {/* Price Field */}
          <div>
            <Input
              label="Precio Base"
              type="number"
              step="0.01"
              min="0"
              value={formData.basePrice}
              onChange={(e) => handleInputChange('basePrice', e.target.value)}
              error={errors.basePrice}
              placeholder="0.00"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}