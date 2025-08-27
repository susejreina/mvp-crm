import { db } from '../firebase';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { Vendor, slugifyEmail } from '../types';

const demoVendors: Omit<Vendor, 'id' | 'createdAt'>[] = [
  {
    name: 'Angela Ojeda',
    email: 'angela@academiadeia.com',
    photoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b791?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    active: true,
  },
  {
    name: 'Angelica Bou',
    email: 'angelica@academiadeia.com',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'seller',
    active: true,
  },
  {
    name: 'Carlos Rodriguez',
    email: 'carlos@academiadeia.com',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'seller',
    active: true,
  },
];

export async function seedVendors(): Promise<void> {
  console.log('Seeding vendors...');
  
  const batch = writeBatch(db);
  const vendorsRef = collection(db, 'vendors');
  
  const now = Timestamp.now();
  
  demoVendors.forEach(vendor => {
    const vendorId = slugifyEmail(vendor.email);
    const docRef = doc(vendorsRef, vendorId);
    
    const vendorData: Vendor = {
      ...vendor,
      id: vendorId,
      createdAt: now,
    };
    
    batch.set(docRef, vendorData);
  });
  
  await batch.commit();
  console.log(`Seeded ${demoVendors.length} vendors`);
}