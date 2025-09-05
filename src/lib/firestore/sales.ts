import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, getDocs, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, Product, SaleComment, saleIdFrom } from '../types';

export interface CreateSaleData {
  // Sale type
  type?: 'individual' | 'group';
  
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
  
  // Group sale users (optional)
  users?: Array<{ name: string; email: string; phone?: string }>;
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
    type: data.type || 'individual',
    
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
    
    // Group sale users (only include if present)
    ...(data.users ? { users: data.users } : {}),
    
    // Status
    status: 'pending',
    
    // Comments
    comments: existingSale.exists() ? existingSale.data().comments || [] : [],
    
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
 * Update sale status
 */
export async function updateSaleStatus(saleId: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  const saleRef = doc(db, 'sales', saleId);
  await updateDoc(saleRef, {
    status,
    updatedAt: Timestamp.now()
  });
}

/**
 * Add comment to sale
 */
export async function addSaleComment(saleId: string, comment: {
  message: string;
  createdBy: string;
  createdByName: string;
}): Promise<void> {
  const saleRef = doc(db, 'sales', saleId);
  const newComment: SaleComment = {
    id: `comment_${Date.now()}`,
    message: comment.message,
    createdBy: comment.createdBy,
    createdByName: comment.createdByName,
    createdAt: Timestamp.now()
  };
  
  await updateDoc(saleRef, {
    comments: arrayUnion(newComment),
    updatedAt: Timestamp.now()
  });
}

/**
 * Update sale status and add comment
 */
export async function updateSaleStatusWithComment(
  saleId: string, 
  status: 'pending' | 'approved' | 'rejected',
  comment: {
    message: string;
    createdBy: string;
    createdByName: string;
  }
): Promise<void> {
  const saleRef = doc(db, 'sales', saleId);
  const newComment: SaleComment = {
    id: `comment_${Date.now()}`,
    message: comment.message,
    createdBy: comment.createdBy,
    createdByName: comment.createdByName,
    createdAt: Timestamp.now()
  };
  
  await updateDoc(saleRef, {
    status,
    comments: arrayUnion(newComment),
    updatedAt: Timestamp.now()
  });
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

export async function createProduct(productData: {
  name: string;
  sku: string;
  baseCurrency: 'USD' | 'MXN' | 'COP';
  basePrice: number;
}): Promise<{ success: boolean; product?: Product }> {
  try {
    const productsRef = collection(db, 'products');
    const productId = productData.sku.toLowerCase().replace(/\s+/g, '-');
    const productRef = doc(productsRef, productId);
    
    // Check if product with same SKU already exists
    const existingProduct = await getDoc(productRef);
    if (existingProduct.exists()) {
      throw new Error('Ya existe un producto con este SKU');
    }
    
    const newProduct = {
      id: productId,
      name: productData.name,
      sku: productData.sku,
      baseCurrency: productData.baseCurrency,
      basePrice: productData.basePrice,
      active: true,
      createdAt: Timestamp.now(),
    };
    
    await setDoc(productRef, newProduct);
    
    return {
      success: true,
      product: newProduct,
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
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