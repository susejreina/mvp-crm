import { Firestore, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import type { Sale } from '@/lib/types';

export async function getTotalApprovedUsd(db: Firestore): Promise<number> {
  try {
    const salesRef = collection(db, 'sales');
    // Get all sales - no currency filter needed since we have usdAmount field
    
    const querySnapshot = await getDocs(salesRef);
    
    let total = 0;
    querySnapshot.forEach((doc) => {
      const sale = doc.data() as Sale;
      // Include pending and approved, exclude rejected
      if (sale.status !== 'rejected') {
        // Use usdAmount field for consistent calculations regardless of currency
        total += sale.usdAmount || sale.amount; // Fallback to amount for legacy data
      }
    });
    
    return total;
  } catch (error) {
    throw new Error(`Failed to get total USD sales: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getClientsCount(db: Firestore): Promise<number> {
  try {
    const clientsRef = collection(db, 'clients');
    
    try {
      const countSnapshot = await getCountFromServer(clientsRef);
      return countSnapshot.data().count;
    } catch {
      // Fallback to getDocs if getCountFromServer fails
      const querySnapshot = await getDocs(clientsRef);
      return querySnapshot.size;
    }
  } catch (error) {
    throw new Error(`Failed to get clients count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getActiveProductsCount(db: Firestore): Promise<number> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('active', '==', true));
    
    try {
      const countSnapshot = await getCountFromServer(q);
      return countSnapshot.data().count;
    } catch {
      // Fallback to getDocs if getCountFromServer fails
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    }
  } catch (error) {
    throw new Error(`Failed to get active products count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSellersCount(db: Firestore): Promise<number> {
  try {
    const vendorsRef = collection(db, 'vendors');
    const q = query(
      vendorsRef,
      where('role', '==', 'seller'),
      where('active', '==', true)
    );
    
    try {
      const countSnapshot = await getCountFromServer(q);
      return countSnapshot.data().count;
    } catch {
      // Fallback to getDocs if getCountFromServer fails
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    }
  } catch (error) {
    throw new Error(`Failed to get sellers count: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}