// scripts/seed.ts
//#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';

// Load .env.local from repo root
config({ path: path.resolve(process.cwd(), '.env.local') });

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { runAllSeeds } from '../src/lib/seed';

interface ParsedArgs {
  resetAll: boolean;
  resetCollections: string[];
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {
    resetAll: false,
    resetCollections: [],
  };

  for (const arg of args) {
    if (arg === '--reset-all') {
      result.resetAll = true;
    } else if (arg.startsWith('--reset=')) {
      const collections = arg.substring('--reset='.length);
      result.resetCollections = collections.split(',').map(c => c.trim()).filter(Boolean);
    }
  }

  return result;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  console.log('Variables:', {
    email: email ? 'OK' : 'MISSING',
    password: password ? 'OK' : 'MISSING',
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'OK' : 'MISSING',
  });

  if (!email || !password) {
    console.error('Missing SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env.local');
    process.exit(1);
  }

  // Parse CLI arguments
  const parsedArgs = parseArgs();
  
  // Build reset options
  const resetOptions = parsedArgs.resetAll 
    ? { all: true }
    : parsedArgs.resetCollections.length > 0
    ? { collections: parsedArgs.resetCollections }
    : undefined;

  if (resetOptions) {
    console.log('\n⚠️  RESET MODE ACTIVE ⚠️');
    if (resetOptions.all) {
      console.log('Will reset ALL reference collections (sources, payment_methods, evidence_types)');
    } else if (resetOptions.collections) {
      console.log(`Will reset collections: ${resetOptions.collections.join(', ')}`);
    }
    console.log('');
  }

  try {
    console.log('Authenticating with Firebase Auth...');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const adminUid = cred.user.uid;
    console.log('OK. Admin UID:', adminUid);

    await runAllSeeds({ adminUid, reset: resetOptions });

    await signOut(auth);
    console.log('Seed completed ✅');
  } catch (err: any) {
    console.error('Error during seed:', err?.message ?? err);
    process.exit(1);
  }
}

main();