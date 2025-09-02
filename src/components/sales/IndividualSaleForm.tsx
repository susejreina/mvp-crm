'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { 
  getActiveClients, 
  resolveClientForSale
} from '../../lib/firestore/clients';
import {
  createSale,
  getProducts,
  getSourcesData,
  getPaymentMethodsData,
  getEvidenceTypesData,
  getWeekNumber,
  validateSaleValue,
  validateEvidenceValue,
  type CreateSaleData
} from '../../lib/firestore/sales';
import { updateClient } from '../../lib/firestore/clients';
import { Client, Product } from '../../lib/types';
import { Timestamp } from 'firebase/firestore';

interface FormData {
  // Client
  selectedClientId: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  
  // Sale
  productId: string;
  saleValue: string;
  currency: string;
  saleDate: string;
  paymentMethod: string;
  source: string;
  week: string;
  iteration: string;
  
  // Evidence
  evidenceType: string;
  evidenceValue: string;
}

interface FormErrors {
  clientName?: string;
  clientEmail?: string;
  productId?: string;
  saleValue?: string;
  currency?: string;
  saleDate?: string;
  paymentMethod?: string;
  source?: string;
  week?: string;
  iteration?: string;
  evidenceValue?: string;
  usdAmount?: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  oldClientName: string;
  newEmail: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ConfirmationModal({ isOpen, oldClientName, newEmail, onConfirm, onCancel }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Confirmar Cambio de Email
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Cambiaste el email de &quot;{oldClientName}&quot;. Esto desactivará el cliente anterior 
          y creará uno nuevo con el email &quot;{newEmail}&quot;. ¿Deseas continuar?
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Venta Registrada
            </h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          La venta ha sido registrada exitosamente en el sistema.
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function IndividualSaleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<FormData | null>(null);
  
  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sources, setSources] = useState<Array<{id: string; name: string}>>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{id: string; name: string}>>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<Array<{id: string; name: string}>>([]);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    selectedClientId: null,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    productId: '',
    saleValue: '',
    currency: '',
    saleDate: new Date().toISOString().split('T')[0], // Today
    paymentMethod: '',
    source: '',
    week: '',
    iteration: '',
    evidenceType: '',
    evidenceValue: '',
  });
  
  const [usdAmount, setUsdAmount] = useState<string>('');
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  
  const clientInputRef = useRef<HTMLInputElement>(null);
  
  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [clientsData, productsData, sourcesData, paymentMethodsData, evidenceTypesData] = 
          await Promise.all([
            getActiveClients(),
            getProducts(),
            getSourcesData(),
            getPaymentMethodsData(),
            getEvidenceTypesData(),
          ]);
        
        setClients(clientsData);
        // Filter only active products
        setProducts(productsData.filter(product => product.active));
        setSources(sourcesData);
        setPaymentMethods(paymentMethodsData);
        setEvidenceTypes(evidenceTypesData);
        
        // No default values for week and iteration - user must fill them
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Week is not auto-calculated - user must enter it manually

  // Update USD amount when currency is USD or sale value changes
  useEffect(() => {
    if (formData.currency === 'USD' && formData.saleValue) {
      setUsdAmount(formData.saleValue);
    } else if (formData.currency !== 'USD') {
      // Keep the current usdAmount value when currency is not USD
    } else {
      setUsdAmount('');
    }
  }, [formData.currency, formData.saleValue]);
  
  // Client autocomplete
  const handleClientNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, clientName: value, selectedClientId: null }));
    
    if (value.length >= 2) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(value.toLowerCase()) ||
        client.email.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowClientSuggestions(true);
    } else {
      setShowClientSuggestions(false);
    }
  };
  
  const selectClient = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      selectedClientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone || '',
    }));
    setShowClientSuggestions(false);
  };
  
  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'El nombre del cliente es requerido';
    }
    
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Formato de email inválido';
    }
    
    if (!formData.productId) {
      newErrors.productId = 'El producto es requerido';
    }
    
    const saleValidation = validateSaleValue(formData.saleValue);
    if (!saleValidation.isValid) {
      newErrors.saleValue = saleValidation.error;
    }
    
    if (!formData.currency) {
      newErrors.currency = 'La moneda es requerida';
    }
    
    if (!formData.saleDate) {
      newErrors.saleDate = 'La fecha de venta es requerida';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'La forma de pago es requerida';
    }
    
    if (!formData.source) {
      newErrors.source = 'La procedencia es requerida';
    }
    
    if (!formData.week || isNaN(parseInt(formData.week))) {
      newErrors.week = 'La semana debe ser un número válido';
    }
    
    if (!formData.iteration || isNaN(parseInt(formData.iteration))) {
      newErrors.iteration = 'La iteración debe ser un número válido';
    }
    
    // USD Amount validation (required when currency is not USD)
    if (formData.currency && formData.currency !== 'USD') {
      if (!usdAmount.trim()) {
        newErrors.usdAmount = 'El valor en USD es requerido cuando la moneda no es USD';
      } else {
        const usdValidation = validateSaleValue(usdAmount);
        if (!usdValidation.isValid) {
          newErrors.usdAmount = 'El valor en USD debe ser un número válido';
        }
      }
    }
    
    // Evidence validation
    if (formData.evidenceType && formData.evidenceValue) {
      const evidenceValidation = validateEvidenceValue(formData.evidenceType, formData.evidenceValue);
      if (!evidenceValidation.isValid) {
        newErrors.evidenceValue = evidenceValidation.error;
      }
    } else if (formData.evidenceType && !formData.evidenceValue) {
      newErrors.evidenceValue = 'El valor de evidencia es requerido cuando se selecciona el tipo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Check if email change requires confirmation
  const needsEmailConfirmation = (): boolean => {
    if (!formData.selectedClientId) return false;
    const selectedClient = clients.find(c => c.id === formData.selectedClientId);
    return selectedClient ? selectedClient.email !== formData.clientEmail : false;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Check if we need email change confirmation
    if (needsEmailConfirmation()) {
      setPendingSubmit(formData);
      setShowConfirmation(true);
      return;
    }
    
    await processSubmit(formData);
  };
  
  const processSubmit = async (data: FormData) => {
    setSaving(true);
    setShowConfirmation(false);
    setPendingSubmit(null);
    
    try {
      // Resolve client
      const { client } = await resolveClientForSale(
        data.selectedClientId,
        data.clientName,
        data.clientEmail,
        data.clientPhone || undefined
      );
      
      // Find product
      const product = products.find(p => p.id === data.productId);
      if (!product) throw new Error('Product not found');
      
      // Normalize sale value
      const saleValidation = validateSaleValue(data.saleValue);
      if (!saleValidation.isValid || !saleValidation.normalizedValue) {
        throw new Error('Invalid sale value');
      }
      
      // Validate and normalize USD amount
      let normalizedUsdAmount: number;
      if (data.currency === 'USD') {
        normalizedUsdAmount = saleValidation.normalizedValue;
      } else {
        const usdValidation = validateSaleValue(usdAmount);
        if (!usdValidation.isValid || !usdValidation.normalizedValue) {
          throw new Error('Invalid USD amount');
        }
        normalizedUsdAmount = usdValidation.normalizedValue;
      }
      
      // Create sale data
      const saleData: CreateSaleData = {
        // Client info
        clientId: client.id,
        customerName: client.name,
        customerEmail: client.email,
        customerPhone: client.phone,
        
        // Product info
        productId: product.id,
        productName: product.name,
        
        // Vendor info (using admin for now)
        vendorId: 'admin',
        vendorName: 'Admin',
        
        // Sale details
        amount: saleValidation.normalizedValue,
        currency: data.currency as 'USD' | 'MXN' | 'COP',
        usdAmount: normalizedUsdAmount,
        date: new Date(data.saleDate),
        
        // Additional fields
        paymentMethod: data.paymentMethod,
        source: data.source,
        week: parseInt(data.week),
        iteration: parseInt(data.iteration),
        
        // Evidence
        evidenceType: data.evidenceType || undefined,
        evidenceValue: data.evidenceValue || undefined,
      };
      
      // Create sale
      await createSale(saleData);
      
      // Update client's lastPurchaseAt
      await updateClient(client.id, {
        lastPurchaseAt: Timestamp.fromDate(new Date(data.saleDate))
      });
      
      // Success - show modal and redirect to dashboard
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error al crear la venta. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client Name with Autocomplete */}
          <div className="relative">
            <label htmlFor="client-name" className="sr-only">
              Nombre de cliente *
            </label>
            <input
              ref={clientInputRef}
              id="client-name"
              type="text"
              value={formData.clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              placeholder="Nombre de cliente*"
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C] ${
                errors.clientName ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.clientName}
              </p>
            )}
            
            {/* Autocomplete suggestions */}
            {showClientSuggestions && filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    onClick={() => selectClient(client)}
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="client-email" className="sr-only">
              Correo *
            </label>
            <input
              id="client-email"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder="Correo*"
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C] ${
                errors.clientEmail ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.clientEmail && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.clientEmail}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="client-phone" className="sr-only">
              Teléfono
            </label>
            <input
              id="client-phone"
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
              placeholder="Telefono"
              className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C]"
            />
          </div>
        </div>

        {/* Row 2: Product, Sale Value, Currency, Sale Date, USD Amount */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Product */}
          <div>
            <label htmlFor="product" className="sr-only">
              Seleccionar producto (SCK) *
            </label>
            <select
              id="product"
              value={formData.productId}
              onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#4A739C] ${
                errors.productId ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="" disabled className="text-[#4A739C]">Seleccionar producto (SCK)*</option>
              {products.map(product => (
                <option key={product.id} value={product.id} className="text-[#4A739C]">
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.productId}
              </p>
            )}
          </div>

          {/* Sale Value */}
          <div>
            <label htmlFor="sale-value" className="sr-only">
              Valor de venta *
            </label>
            <input
              id="sale-value"
              type="text"
              value={formData.saleValue}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers, dots, and commas
                if (/^[\d.,]*$/.test(value)) {
                  setFormData(prev => ({ ...prev, saleValue: value }));
                }
              }}
              placeholder="Valor de venta*"
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C] ${
                errors.saleValue ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.saleValue && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.saleValue}
              </p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="sr-only">
              Moneda *
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#4A739C] ${
                errors.currency ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="" disabled className="text-[#4A739C]">Moneda*</option>
              <option value="USD" className="text-[#4A739C]">USD ($)</option>
              <option value="MXN" className="text-[#4A739C]">MXN ($)</option>
              <option value="COP" className="text-[#4A739C]">COP ($)</option>
            </select>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.currency}
              </p>
            )}
          </div>

          {/* Sale Date */}
          <div>
            <label htmlFor="sale-date" className="sr-only">
              Fecha de venta *
            </label>
            <input
              id="sale-date"
              type="date"
              value={formData.saleDate}
              onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C] ${
                errors.saleDate ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.saleDate && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.saleDate}
              </p>
            )}
          </div>

          {/* USD Amount */}
          <div>
            <label htmlFor="usd-amount" className="sr-only">
              Valor en USD
            </label>
            <input
              id="usd-amount"
              type="text"
              value={usdAmount}
              onChange={(e) => {
                if (formData.currency !== 'USD') {
                  const value = e.target.value;
                  // Only allow numbers, dots, and commas
                  if (/^[\d.,]*$/.test(value)) {
                    setUsdAmount(value);
                  }
                }
              }}
              readOnly={formData.currency === 'USD'}
              placeholder={formData.currency === 'USD' ? "Valor en USD" : "Valor en USD*"}
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none placeholder:text-[#4A739C] text-[#4A739C] ${
                formData.currency === 'USD' 
                  ? 'cursor-not-allowed' 
                  : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              } ${
                errors.usdAmount ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.usdAmount && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.usdAmount}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Payment Method, Source, Week, Iteration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Payment Method */}
          <div>
            <label htmlFor="payment-method" className="sr-only">
              Forma de pago *
            </label>
            <select
              id="payment-method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#4A739C] ${
                errors.paymentMethod ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="" disabled className="text-[#4A739C]">Forma de pago*</option>
              {paymentMethods.map(pm => (
                <option key={pm.id} value={pm.id} className="text-[#4A739C]">
                  {pm.name}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Source */}
          <div>
            <label htmlFor="source" className="sr-only">
              Procedencia *
            </label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#4A739C] ${
                errors.source ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="" disabled className="text-[#4A739C]">Procedencia*</option>
              {sources.map(source => (
                <option key={source.id} value={source.id} className="text-[#4A739C]">
                  {source.name}
                </option>
              ))}
            </select>
            {errors.source && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.source}
              </p>
            )}
          </div>

          {/* Week */}
          <div>
            <label htmlFor="week" className="sr-only">
              Semana *
            </label>
            <input
              id="week"
              type="text"
              value={formData.week}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers
                if (/^\d*$/.test(value)) {
                  setFormData(prev => ({ ...prev, week: value }));
                }
              }}
              placeholder="Semana"
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C] ${
                errors.week ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.week && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.week}
              </p>
            )}
          </div>

          {/* Iteration */}
          <div>
            <label htmlFor="iteration" className="sr-only">
              Iteración *
            </label>
            <input
              id="iteration"
              type="text"
              value={formData.iteration}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers
                if (/^\d*$/.test(value)) {
                  setFormData(prev => ({ ...prev, iteration: value }));
                }
              }}
              placeholder="Iteracion"
              className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C] ${
                errors.iteration ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.iteration && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.iteration}
              </p>
            )}
          </div>
        </div>

        {/* Evidence Row - left aligned and 50% width */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Evidencia de la transacción</h3>
          
          <div className="w-1/2 flex gap-4">
            {/* Evidence Type Select */}
            <div className="flex-1">
              <label htmlFor="evidence-type" className="sr-only">
                Evidencia de la transacción
              </label>
              <select
                id="evidence-type"
                value={formData.evidenceType}
                onChange={(e) => setFormData(prev => ({ ...prev, evidenceType: e.target.value, evidenceValue: '' }))}
                className="w-full px-3 py-3 bg-[#E8EDF5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#4A739C]"
              >
                <option value="" className="text-[#4A739C]">Evidencia de la transacción</option>
                {evidenceTypes.map(et => (
                  <option key={et.id} value={et.id} className="text-[#4A739C]">
                    {et.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Evidence Value Input */}
            {formData.evidenceType && (
              <div className="flex-1">
                <label htmlFor="evidence-value" className="sr-only">
                  {formData.evidenceType === 'url' ? 'URL' : 'Número de transacción'}
                </label>
                <input
                  id="evidence-value"
                  type="text"
                  value={formData.evidenceValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, evidenceValue: e.target.value }))}
                  placeholder={
                    formData.evidenceType === 'url' 
                      ? 'Pega la URL...'
                      : 'Número de transacción...'
                  }
                  className={`w-full px-3 py-3 bg-[#E8EDF5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-[#4A739C] text-[#4A739C] ${
                    errors.evidenceValue ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.evidenceValue && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.evidenceValue}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
          >
            {saving ? 'Guardando Venta...' : 'Registrar venta'}
          </Button>
        </div>
      </form>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        oldClientName={
          formData.selectedClientId 
            ? clients.find(c => c.id === formData.selectedClientId)?.name || ''
            : ''
        }
        newEmail={formData.clientEmail}
        onConfirm={() => pendingSubmit && processSubmit(pendingSubmit)}
        onCancel={() => {
          setShowConfirmation(false);
          setPendingSubmit(null);
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push('/dashboard');
        }}
      />
      
      {/* Click outside to close suggestions */}
      {showClientSuggestions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowClientSuggestions(false)}
        />
      )}
    </>
  );
}