import { db } from '../firebase';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { Vendor, slugifyEmail } from '../types';

const demoVendors: Omit<Vendor, 'id' | 'createdAt'>[] = [
  { name: 'Angela Ojeda', email: 'angela@academiadeia.com', photoUrl: 'https://i.pravatar.cc/150?u=angela', role: 'admin', position: 'Director Comercial', active: true },
  { name: 'Angelica Bou', email: 'angelica@academiadeia.com', photoUrl: 'https://i.pravatar.cc/150?u=angelica', role: 'seller', position: 'Vendedor', active: true },
  { name: 'Carlos Rodriguez', email: 'carlos@academiadeia.com', photoUrl: 'https://i.pravatar.cc/150?u=carlos', role: 'seller', position: 'Vendedor', active: true },
];

export async function seedVendors() {
  console.log('Seeding vendors...');
  const batch = writeBatch(db);
  const vendorsRef = collection(db, 'vendors');
  const now = Timestamp.now();

  demoVendors.forEach(vendor => {
    const vendorId = slugifyEmail(vendor.email);
    const docRef = doc(vendorsRef, vendorId);
    batch.set(docRef, { ...vendor, id: vendorId, createdAt: now });
  });

  await batch.commit();
  console.log(`Seeded ${demoVendors.length} vendors`);
}
