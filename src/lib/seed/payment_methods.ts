import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { PaymentMethod } from '../types';

const paymentMethodsData: Array<{ id: string; name: string }> = [
  { id: 'transfer', name: 'Transferencia' },
  { id: 'card', name: 'Tarjeta' },
  { id: 'paypal', name: 'PayPal' },
  { id: 'other', name: 'Otro' },
];

export async function seedPaymentMethods(): Promise<{ created: number; updated: number; skipped: number }> {
  console.log('Seeding payment methods...');
  const paymentMethodsRef = collection(db, 'payment_methods');
  const now = Timestamp.now();
  
  let created = 0;
  const updated = 0;
  const skipped = 0;

  for (const method of paymentMethodsData) {
    const docRef = doc(paymentMethodsRef, method.id);
    const data: PaymentMethod = {
      id: method.id,
      name: method.name,
      createdAt: now,
    };
    
    await setDoc(docRef, data, { merge: true });
    created++;
  }

  console.log(`Payment methods: ${created} upserted`);
  return { created, updated, skipped };
}

export async function resetPaymentMethods(): Promise<number> {
  console.log('Resetting payment_methods collection...');
  const paymentMethodsRef = collection(db, 'payment_methods');
  const snapshot = await getDocs(paymentMethodsRef);
  
  let deleted = 0;
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    deleted++;
  }
  
  console.log(`Deleted ${deleted} payment methods`);
  return deleted;
}