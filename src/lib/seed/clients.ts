import { db } from '../firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { Client, SaleUser, slugifyEmail } from '../types';

export interface SaleInput {
  type: 'individual' | 'group';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: Timestamp;
  users?: SaleUser[];
}

export async function upsertClientFromSaleInput(saleInput: SaleInput): Promise<void> {
  const clientId = slugifyEmail(saleInput.customerEmail);
  const clientRef = doc(collection(db, 'clients'), clientId);
  
  const baseClientData: Partial<Client> = {
    id: clientId,
    name: saleInput.customerName,
    email: saleInput.customerEmail,
    phone: saleInput.customerPhone,
    lastPurchaseAt: saleInput.date,
  };
  
  // For new clients, set creation timestamp
  const clientData: Partial<Client> = {
    ...baseClientData,
    createdAt: Timestamp.now(),
  };
  
  // If it's a group sale, merge users array
  if (saleInput.type === 'group' && saleInput.users) {
    clientData.users = saleInput.users;
  }
  
  // Use merge: true for idempotency
  await setDoc(clientRef, clientData, { merge: true });
}