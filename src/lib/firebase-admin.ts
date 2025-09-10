import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function initAdmin() {
  console.log("initAdmin");
  
  // Check if we have all required admin config
  const hasValidAdminConfig = process.env.FIREBASE_PROJECT_ID && 
                             process.env.FIREBASE_CLIENT_EMAIL && 
                             process.env.FIREBASE_PRIVATE_KEY;
  
  if (!hasValidAdminConfig) {
    console.warn('Firebase Admin not initialized: Missing configuration');
    return false;
  }
  
  if (getApps().length === 0) {
    try {
      const firebaseAdminConfig = {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      };
      
      console.log("INIT FIREBASE ADMIN", { projectId: process.env.FIREBASE_PROJECT_ID });
      initializeApp(firebaseAdminConfig);
      return true;
    } catch (error) {
      console.error('Firebase Admin initialization failed:', error);
      return false;
    }
  }
  return true;
}

export const adminAuth = () => {
  console.log("adminAuth");
  initAdmin();
  return getAuth();
};

export const adminDb = () => {
  console.log("adminDb");
  initAdmin();
  return getFirestore();
};
