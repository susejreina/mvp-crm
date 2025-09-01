// src/lib/seed/clients.ts
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

export async function upsertClientFromSaleInput(sale: SaleInput): Promise<void> {
  const clientId = slugifyEmail(sale.customerEmail);
  const clientRef = doc(collection(db, 'clients'), clientId);

  const data: Partial<Client> = {
    id: clientId,
    name: sale.customerName,
    email: sale.customerEmail,
    lastPurchaseAt: sale.date,
    createdAt: Timestamp.now(),
  };
  if (sale.customerPhone) data.phone = sale.customerPhone;
  if (sale.type === 'group' && sale.users?.length) data.users = sale.users;

  await setDoc(clientRef, data, { merge: true });
}
