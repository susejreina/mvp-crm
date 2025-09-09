// src/lib/seed/clients.ts
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, Timestamp } from 'firebase/firestore';
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
    active: true,
    lastPurchaseAt: sale.date,
    createdAt: Timestamp.now(),
  };
  if (sale.customerPhone) data.phone = sale.customerPhone;
  if (sale.type === 'group' && sale.users?.length) data.users = sale.users;

  await setDoc(clientRef, data, { merge: true });
}

export async function migrateClientsActiveField(): Promise<number> {
  console.log('Migrating clients to add active field...');
  const clientsRef = collection(db, 'clients');
  const snapshot = await getDocs(clientsRef);
  
  let migrated = 0;
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    if (data.active === undefined) {
      await setDoc(docSnapshot.ref, { active: true }, { merge: true });
      migrated++;
    }
  }
  
  if (migrated > 0) {
    console.log(`Migrated ${migrated} clients to include active field`);
  }
  return migrated;
}
