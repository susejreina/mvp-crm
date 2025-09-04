import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Vendor } from '../types';

/**
 * Check if a user with the given email exists in vendors collection with admin role
 */
export async function isValidVendorAdmin(email: string): Promise<boolean> {
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
    
    // Check if vendor is active and has admin role
    return vendorData.active === true && vendorData.role === 'admin';
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