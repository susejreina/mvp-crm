import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Vendor } from '../types';

/**
 * Check if a user with the given email exists in vendors collection (admin or seller)
 */
export async function isValidVendor(email: string): Promise<boolean> {
  try {
    // Generate vendor ID from email (same logic as createVendor)
    const vendorId = email.toLowerCase()
      .replace(/[^a-z0-9@.]/g, '-')
      .replace(/@/g, '-')
      .replace(/\./g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const vendorRef = doc(db, 'vendors', vendorId);
    const vendorSnap = await getDoc(vendorRef);
    
    if (!vendorSnap.exists()) {
      return false;
    }
    
    const vendorData = vendorSnap.data() as Vendor;
    
    // Check if vendor is active (both admin and seller can login)
    return vendorData.active === true;
  } catch (error) {
    console.error('Error checking vendor status:', error);
    return false;
  }
}

/**
 * Check if a user with the given email exists in vendors collection with admin role
 * @deprecated Use isValidVendor and getVendorByEmail instead
 */
export async function isValidVendorAdmin(email: string): Promise<boolean> {
  try {
    const vendor = await getVendorByEmail(email);
    return vendor !== null && vendor.active === true && vendor.role === 'admin';
  } catch (error) {
    console.error('Error checking vendor admin status:', error);
    return false;
  }
}

/**
 * Get vendor data by email
 */
export async function getVendorByEmail(email: string): Promise<Vendor | null> {
  try {
    const vendorId = email.toLowerCase()
      .replace(/[^a-z0-9@.]/g, '-')
      .replace(/@/g, '-')
      .replace(/\./g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const vendorRef = doc(db, 'vendors', vendorId);
    const vendorSnap = await getDoc(vendorRef);
    
    if (!vendorSnap.exists()) {
      return null;
    }
    
    return {
      id: vendorSnap.id,
      ...vendorSnap.data()
    } as Vendor;
  } catch (error) {
    console.error('Error getting vendor by email:', error);
    return null;
  }
}

/**
 * Update vendor's Google profile photo URL
 */
export async function updateVendorGooglePhoto(email: string, photoUrl: string | null): Promise<void> {
  try {
    const vendorId = email.toLowerCase()
      .replace(/[^a-z0-9@.]/g, '-')
      .replace(/@/g, '-')
      .replace(/\./g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const vendorRef = doc(db, 'vendors', vendorId);
    const vendorSnap = await getDoc(vendorRef);
    
    if (vendorSnap.exists()) {
      await updateDoc(vendorRef, {
        googlePhotoUrl: photoUrl,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error updating vendor Google photo:', error);
  }
}