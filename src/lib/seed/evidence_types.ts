import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { EvidenceType } from '../types';

const evidenceTypesData: Array<{ id: string; name: string }> = [
  { id: 'url', name: 'URL' },
  { id: 'transaction_number', name: 'Número de transacción' },
];

export async function seedEvidenceTypes(): Promise<{ created: number; updated: number; skipped: number }> {
  console.log('Seeding evidence types...');
  const evidenceTypesRef = collection(db, 'evidence_types');
  const now = Timestamp.now();
  
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const type of evidenceTypesData) {
    const docRef = doc(evidenceTypesRef, type.id);
    const data: EvidenceType = {
      id: type.id,
      name: type.name,
      createdAt: now,
    };
    
    await setDoc(docRef, data, { merge: true });
    created++;
  }

  console.log(`Evidence types: ${created} upserted`);
  return { created, updated, skipped };
}

export async function resetEvidenceTypes(): Promise<number> {
  console.log('Resetting evidence_types collection...');
  const evidenceTypesRef = collection(db, 'evidence_types');
  const snapshot = await getDocs(evidenceTypesRef);
  
  let deleted = 0;
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    deleted++;
  }
  
  console.log(`Deleted ${deleted} evidence types`);
  return deleted;
}