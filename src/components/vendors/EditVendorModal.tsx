'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ProfileImageUpload from '../ui/ProfileImageUpload';
import { Vendor } from '@/lib/types';
import { updateVendorProfileImageBase64, removeVendorProfileImageBase64 } from '@/lib/firestore/imageUtils';

interface EditVendorModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSubmit: (vendorId: string, vendorData: {
    name: string;
    email: string;
    role: 'admin' | 'seller';
    position: string;
  }) => Promise<void>;
  onImageUpdate?: () => Promise<void>;
}

export default function EditVendorModal({ vendor, onClose, onSubmit, onImageUpdate }: EditVendorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'seller' as 'admin' | 'seller',
    position: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    role?: string;
    position?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when vendor prop changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        role: vendor.role || 'seller',
        position: vendor.position || '',
      });
    }
  }, [vendor]);

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'seller', label: 'Vendedor' },
  ];

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingrese un correo válido';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    // Position validation
    if (!formData.position.trim()) {
      newErrors.position = 'El cargo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !vendor) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(vendor.id, formData);
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

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!vendor) throw new Error('No vendor selected');
    
    try {
      const imageUrl = await updateVendorProfileImageBase64(vendor.id, file);
      // Refresh vendor data in parent
      await onImageUpdate?.();
      return imageUrl;
    } catch (error) {
      throw error;
    }
  };

  const handleImageRemove = async (): Promise<void> => {
    if (!vendor) return;
    
    try {
      await removeVendorProfileImageBase64(vendor.id);
      // Refresh vendor data in parent
      await onImageUpdate?.();
    } catch (error) {
      throw error;
    }
  };

  if (!vendor) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Editar Vendedor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Image Upload */}
        <div className="mb-6">
          <ProfileImageUpload
            currentImageUrl={vendor.photoUrl}
            googleImageUrl={vendor.googlePhotoUrl}
            userName={vendor.name}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <Input
              label="Nombre"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Ingrese el nombre completo"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <Input
              label="Correo"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              placeholder="ejemplo@dominio.com"
              required
              disabled
            />
          </div>

          {/* Role Field */}
          <div>
            <Select
              label="Rol"
              options={roleOptions}
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'seller')}
              error={errors.role}
              required
            />
          </div>

          {/* Position Field */}
          <div>
            <Input
              label="Cargo"
              type="text"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              error={errors.position}
              placeholder="Ej: Director Comercial, Gerente de Ventas"
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
              Actualizar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}