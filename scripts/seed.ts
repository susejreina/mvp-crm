#!/usr/bin/env node
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { runAllSeeds } from '../src/lib/seed';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  
  if (!email || !password) {
    console.error('Error: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in environment');
    console.error('Add them to your .env.local file:');
    console.error('SEED_ADMIN_EMAIL=your-admin@domain.com');
    console.error('SEED_ADMIN_PASSWORD=your-password');
    process.exit(1);
  }
  
  try {
    console.log('Authenticating with Firebase Auth...');
    console.log(`Email: ${email}`);
    
    // Authenticate with Email/Password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const adminUid = userCredential.user.uid;
    
    console.log('Authentication successful');
    console.log(`Admin UID: ${adminUid}`);
    
    // Run all seeds
    await runAllSeeds({ adminUid });
    
    // Sign out
    await signOut(auth);
    console.log('Signed out successfully');
    
  } catch (error: any) {
    console.error('Seed script failed:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});