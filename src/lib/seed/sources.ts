import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { Source } from '../types';

const sourcesData: Array<{ id: string; name: string }> = [
  { id: 'hotmart', name: 'Hotmart' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'referral', name: 'Referral' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'email_campaign', name: 'Campaña de correo' },
  { id: 'aspe', name: 'ASPE' },
  { id: 'manual', name: 'Manual' },
];

export async function seedSources(): Promise<{ created: number; updated: number; skipped: number }> {
  console.log('Seeding sources...');
  const sourcesRef = collection(db, 'sources');
  const now = Timestamp.now();
  
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const source of sourcesData) {
    const docRef = doc(sourcesRef, source.id);
    const data: Source = {
      id: source.id,
      name: source.name,
      createdAt: now,
    };
    
    await setDoc(docRef, data, { merge: true });
    created++;
  }

  console.log(`Sources: ${created} upserted`);
  return { created, updated, skipped };
}

export async function resetSources(): Promise<number> {
  console.log('Resetting sources collection...');
  const sourcesRef = collection(db, 'sources');
  const snapshot = await getDocs(sourcesRef);
  
  let deleted = 0;
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    deleted++;
  }
  
  console.log(`Deleted ${deleted} sources`);
  return deleted;
}