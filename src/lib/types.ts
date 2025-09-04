import { Timestamp } from 'firebase/firestore';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: 'admin' | 'seller';
  active: boolean;
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  baseCurrency: 'USD' | 'MXN' | 'COP';
  basePrice: number;
  active: boolean;
  createdAt: Timestamp;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  users?: Array<{ name: string; email: string; phone?: string }>;
  active: boolean;
  createdAt: Timestamp;
  lastPurchaseAt?: Timestamp;
}

export interface Source {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface PaymentMethod {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface EvidenceType {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface SaleComment {
  id: string;
  message: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
}

export interface Sale {
  id: string;
  type: 'individual' | 'group';
  
  // Client relationship (FK + denormalized)
  clientId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Product (FK + denormalized)
  productId: string;
  productName: string;
  
  // Vendor (FK + denormalized)
  vendorId: string;
  vendorName: string;
  
  amount: number;
  currency: 'USD' | 'MXN' | 'COP';
  usdAmount: number; // Amount in USD for consistent dashboard calculations
  date: Timestamp;
  
  paymentMethod: 'transfer_mx' | 'transfer_co' | 'card' | 'paypal' | 'other';
  source: string;
  week: number;
  iteration: number;
  evidenceType?: string;
  evidenceValue?: string;
  
  status: 'pending' | 'approved' | 'rejected';
  
  // Only for group sales
  users?: Array<{ name: string; email: string; phone?: string }>;
  
  // Comments array
  comments?: SaleComment[];
  
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type SaleUser = {
  name: string;
  email: string;
  phone?: string;
};

// Utility functions
export function slugifyEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function saleIdFrom({
  customerEmail,
  dateISO,
  productId
}: {
  customerEmail: string;
  dateISO: string; // YYYY-MM-DD format
  productId: string;
}): string {
  const emailSlug = slugifyEmail(customerEmail);
  return `${emailSlug}-${dateISO}-${productId}`;
}