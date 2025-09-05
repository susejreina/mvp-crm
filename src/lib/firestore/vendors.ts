import { collection, getDocs, query, where, doc, setDoc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Vendor } from '../types';
import { uploadProfileImage, deleteProfileImage } from './storage';

/**
 * Get all active vendors for autocomplete
 */
export async function getActiveVendors(): Promise<Vendor[]> {
  const vendorsRef = collection(db, 'vendors');
  const q = query(vendorsRef, where('active', '==', true));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Vendor));
}

/**
 * Get all vendors (active and inactive) for management
 */
export async function getAllVendors(): Promise<Vendor[]> {
  const vendorsRef = collection(db, 'vendors');
  const q = query(vendorsRef, orderBy('name'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Vendor));
}

/**
 * Create a new vendor (calls API route to create user in Firebase Auth)
 */
export async function createVendor(vendorData: {
  name: string;
  email: string;
  role: 'admin' | 'seller';
  position?: string;
}): Promise<{ success: boolean; message?: string; tempPassword?: string; resetLink?: string }> {
  try {
    const response = await fetch('/api/vendors/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vendorData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create vendor');
    }

    return result;
  } catch (error) {
    console.error('Error creating vendor:', error);
    throw error;
  }
}

/**
 * Update vendor role
 */
export async function updateVendorRole(vendorId: string, role: 'admin' | 'seller'): Promise<void> {
  const vendorRef = doc(db, 'vendors', vendorId);
  await updateDoc(vendorRef, {
    role,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update vendor information
 */
export async function updateVendor(vendorId: string, vendorData: {
  name: string;
  role: 'admin' | 'seller';
  position: string;
}): Promise<void> {
  const vendorRef = doc(db, 'vendors', vendorId);
  await updateDoc(vendorRef, {
    name: vendorData.name,
    role: vendorData.role,
    position: vendorData.position,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Toggle vendor active status
 */
export async function toggleVendorStatus(vendorId: string, active: boolean): Promise<void> {
  const vendorRef = doc(db, 'vendors', vendorId);
  await updateDoc(vendorRef, {
    active,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update vendor profile image
 */
export async function updateVendorProfileImage(
  vendorId: string, 
  imageFile: File
): Promise<string> {
  try {
    // Upload new image to Firebase Storage
    const imageUrl = await uploadProfileImage(vendorId, imageFile);
    
    // Update vendor document with new image URL
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      photoUrl: imageUrl,
      hasCustomPhoto: true,
      updatedAt: Timestamp.now(),
    });
    
    return imageUrl;
  } catch (error) {
    console.error('Error updating vendor profile image:', error);
    throw error;
  }
}

/**
 * Remove vendor profile image
 */
export async function removeVendorProfileImage(vendorId: string): Promise<void> {
  try {
    // Delete image from Firebase Storage
    await deleteProfileImage(vendorId);
    
    // Update vendor document to remove image URL
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      photoUrl: null,
      hasCustomPhoto: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing vendor profile image:', error);
    throw error;
  }
}