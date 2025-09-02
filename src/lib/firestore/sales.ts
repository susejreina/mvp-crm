import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, Product, saleIdFrom } from '../types';

export interface CreateSaleData {
  // Client info
  clientId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Product info
  productId: string;
  productName: string;
  
  // Vendor info
  vendorId: string;
  vendorName: string;
  
  // Sale details
  amount: number;
  currency: 'USD' | 'MXN' | 'COP';
  usdAmount: number; // Amount in USD for consistent dashboard calculations
  date: Date;
  
  // Additional fields
  paymentMethod: string;
  source: string;
  week: number;
  iteration: number;
  
  // Evidence (optional)
  evidenceType?: string;
  evidenceValue?: string;
}

/**
 * Create or update a sale (idempotent operation)
 */
export async function createSale(data: CreateSaleData): Promise<Sale> {
  const dateISO = data.date.toISOString().split('T')[0]; // YYYY-MM-DD
  const saleId = saleIdFrom({
    customerEmail: data.customerEmail,
    dateISO,
    productId: data.productId
  });
  
  const saleRef = doc(db, 'sales', saleId);
  
  // Check if sale already exists
  const existingSale = await getDoc(saleRef);
  
  const saleData: Omit<Sale, 'id'> = {
    type: 'individual',
    
    // Client info (denormalized)
    clientId: data.clientId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    
    // Product info (denormalized)
    productId: data.productId,
    productName: data.productName,
    
    // Vendor info (denormalized)
    vendorId: data.vendorId,
    vendorName: data.vendorName,
    
    // Sale details
    amount: data.amount,
    currency: data.currency,
    usdAmount: data.usdAmount,
    date: Timestamp.fromDate(data.date),
    
    // Additional fields
    paymentMethod: data.paymentMethod as Sale['paymentMethod'], // Type will be validated by form
    source: data.source,
    week: data.week,
    iteration: data.iteration,
    
    // Evidence (only include if present)
    ...(data.evidenceType ? { evidenceType: data.evidenceType } : {}),
    ...(data.evidenceValue ? { evidenceValue: data.evidenceValue } : {}),
    
    // Status
    status: 'pending',
    
    // Metadata
    createdBy: data.vendorId, // Will be updated with actual current user
    createdAt: existingSale.exists() ? existingSale.data().createdAt : Timestamp.now(),
    ...(existingSale.exists() ? { updatedAt: Timestamp.now() } : {}),
  };
  
  await setDoc(saleRef, saleData);
  
  return {
    id: saleId,
    ...saleData,
  };
}

/**
 * Get all products
 */
export async function getProducts(): Promise<Product[]> {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
}

/**
 * Get all reference data (sources, payment methods, evidence types)
 */
export async function getSourcesData() {
  const sourcesRef = collection(db, 'sources');
  const snapshot = await getDocs(sourcesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPaymentMethodsData() {
  const pmRef = collection(db, 'payment_methods');
  const snapshot = await getDocs(pmRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getEvidenceTypesData() {
  const etRef = collection(db, 'evidence_types');
  const snapshot = await getDocs(etRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Calculate week number from date (simple implementation)
 */
export function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

/**
 * Validate sale value - only numbers, dots and commas
 */
export function validateSaleValue(value: string): { isValid: boolean; normalizedValue?: number; error?: string } {
  if (!value.trim()) {
    return { isValid: false, error: 'El valor de venta es requerido' };
  }
  
  // Allow only numbers, dots, and commas
  if (!/^[\d.,]+$/.test(value)) {
    return { isValid: false, error: 'Solo se permiten números, puntos y comas' };
  }
  
  // Normalize: replace comma with dot, then parse
  const normalized = value.replace(',', '.');
  const numValue = parseFloat(normalized);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Formato de número inválido' };
  }
  
  if (numValue <= 0) {
    return { isValid: false, error: 'El valor de venta debe ser mayor a 0' };
  }
  
  return { isValid: true, normalizedValue: numValue };
}

/**
 * Validate evidence value based on type
 */
export function validateEvidenceValue(type: string, value: string): { isValid: boolean; error?: string } {
  if (!value.trim()) {
    return { isValid: false, error: 'El valor de evidencia es requerido cuando se selecciona el tipo' };
  }
  
  switch (type) {
    case 'url':
      try {
        new URL(value);
        return { isValid: true };
      } catch {
        return { isValid: false, error: 'Formato de URL inválido' };
      }
    
    case 'transaction_number':
      if (!/^[a-zA-Z0-9]{4,64}$/.test(value)) {
        return { isValid: false, error: 'El número de transacción debe tener entre 4-64 caracteres alfanuméricos' };
      }
      return { isValid: true };
    
    default:
      return { isValid: true };
  }
}