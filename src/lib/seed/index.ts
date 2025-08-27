import { seedProducts } from './products';
import { seedVendors } from './vendors';
import { seedSales } from './sales';

export async function runAllSeeds({ adminUid }: { adminUid: string }): Promise<void> {
  console.log('Starting database seeding process...');
  console.log(`Admin UID: ${adminUid}`);
  
  try {
    // Order is important: products → vendors → sales
    // Sales depends on products and vendors existing
    
    console.log('\n1/3 Seeding products...');
    await seedProducts();
    
    console.log('\n2/3 Seeding vendors...');
    await seedVendors();
    
    console.log('\n3/3 Seeding sales (with clients)...');
    await seedSales({ adminUid });
    
    console.log('\nDatabase seeding completed successfully!');
    
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}