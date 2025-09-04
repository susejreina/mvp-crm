'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, MoreHorizontal, Search, Eye, UserX, UserCheck } from 'lucide-react';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Toast from '../../../components/ui/Toast';
import AddVendorModal from '../../../components/vendors/AddVendorModal';
import { getAllVendors, createVendor, updateVendorRole, toggleVendorStatus } from '../../../lib/firestore/vendors';
import { Vendor } from '../../../lib/types';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

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

  // Filter vendors when search term or role filter changes
  useEffect(() => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((vendor) => vendor.role === roleFilter);
    }

    setFilteredVendors(filtered);
  }, [vendors, searchTerm, roleFilter]);

  const loadVendors = async () => {
    try {
      const vendorsData = await getAllVendors();
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setToast({
        message: 'Error al cargar vendedores',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (vendorData: {
    name: string;
    email: string;
    role: 'admin' | 'seller';
    position: string;
  }) => {
    try {
      await createVendor(vendorData);
      await loadVendors(); // Reload vendors list
      setShowAddModal(false);
      setToast({
        message: 'Vendedor agregado correctamente',
        type: 'success',
      });
    } catch (error) {
      console.error('Error creating vendor:', error);
      setToast({
        message: 'Error al agregar vendedor',
        type: 'error',
      });
    }
  };

  const handleRoleChange = async (vendorId: string, newRole: 'admin' | 'seller') => {
    try {
      await updateVendorRole(vendorId, newRole);
      // Update local state
      setVendors(prev => 
        prev.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, role: newRole }
            : vendor
        )
      );
      setToast({
        message: 'Rol actualizado correctamente',
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating vendor role:', error);
      setToast({
        message: 'Error al actualizar el rol',
        type: 'error',
      });
    }
  };

  const handleDropdownToggle = (vendorId: string) => {
    setDropdownOpen(dropdownOpen === vendorId ? null : vendorId);
  };

  const handleToggleStatus = async (vendorId: string, currentStatus: boolean) => {
    try {
      await toggleVendorStatus(vendorId, !currentStatus);
      // Update local state
      setVendors(prev => 
        prev.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, active: !currentStatus }
            : vendor
        )
      );
      setDropdownOpen(null);
      setToast({
        message: `Vendedor ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      setToast({
        message: 'Error al cambiar el estado del vendedor',
        type: 'error',
      });
    }
  };

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'seller', label: 'Vendedor' },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'seller':
        return 'Vendedor';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando vendedores...</span>
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
              { label: 'Vendedores' },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl text-gray-900">Vendedores</h1>
          <Button onClick={() => setShowAddModal(true)} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Vendedor
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Busca por nombre o correo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-48">
            <Select
              placeholder="Rol"
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || roleFilter
                        ? 'No se encontraron vendedores que coincidan con los filtros.'
                        : 'No hay vendedores registrados.'}
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium flex items-center ${
                          vendor.active ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {vendor.name}
                          {!vendor.active && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${vendor.active ? 'text-gray-500' : 'text-gray-400'}`}>
                          {vendor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${vendor.active ? 'text-gray-500' : 'text-gray-400'}`}>
                          {vendor.position || 'Sin cargo'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={vendor.role}
                          onChange={(e) => handleRoleChange(vendor.id, e.target.value as 'admin' | 'seller')}
                          className="text-sm text-gray-900 font-medium border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="admin">Administrador</option>
                          <option value="seller">Vendedor</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button
                          type="button"
                          onClick={() => handleDropdownToggle(vendor.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          aria-label={`Más acciones para ${vendor.name}`}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        
                        {dropdownOpen === vendor.id && (
                          <div 
                            ref={dropdownRef} 
                            className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleToggleStatus(vendor.id, vendor.active)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {vendor.active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <AddVendorModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddVendor}
        />
      )}

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