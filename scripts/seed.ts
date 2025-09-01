// scripts/seed.ts
//#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';

// Carga .env.local desde la raíz del repo
config({ path: path.resolve(process.cwd(), '.env.local') });

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { runAllSeeds } from '../src/lib/seed';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  console.log('Variables:', {
    email: email ? 'OK' : 'FALTA',
    password: password ? 'OK' : 'FALTA',
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'OK' : 'FALTA',
  });

  if (!email || !password) {
    console.error('Faltan SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD en .env.local');
    process.exit(1);
  }

  try {
    console.log('Autenticando con Firebase Auth...');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const adminUid = cred.user.uid;
    console.log('OK. Admin UID:', adminUid);

    await runAllSeeds({ adminUid });

    await signOut(auth);
    console.log('Seed completado ✅');
  } catch (err: any) {
    console.error('Error durante el seed:', err?.message ?? err);
    process.exit(1);
  }
}

main();
