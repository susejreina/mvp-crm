import { seedProducts } from './products';
import { seedVendors } from './vendors';
import { seedSales } from './sales';
import { seedSources, resetSources } from './sources';
import { seedPaymentMethods, resetPaymentMethods } from './payment_methods';
import { seedEvidenceTypes, resetEvidenceTypes } from './evidence_types';
import { migrateClientsActiveField } from './clients';

interface ResetOptions {
  all?: boolean;
  collections?: string[];
}

interface SeedStats {
  collection: string;
  created: number;
  updated: number;
  skipped: number;
  deleted?: number;
}

export async function runAllSeeds({ 
  adminUid, 
  reset 
}: { 
  adminUid: string; 
  reset?: ResetOptions 
}): Promise<void> {
  console.log('Starting database seeding process...');
  console.log(`Admin UID: ${adminUid}`);
  
  const stats: SeedStats[] = [];
  
  try {
    // Handle reset if requested
    if (reset) {
      const collectionsToReset = reset.all 
        ? ['sources', 'payment_methods', 'evidence_types']
        : (reset.collections || []);
      
      if (collectionsToReset.length > 0) {
        console.log('\n=== RESET MODE ===');
        console.log(`Collections to reset: ${collectionsToReset.join(', ')}`);
        
        for (const collectionName of collectionsToReset) {
          let deleted = 0;
          switch (collectionName) {
            case 'sources':
              deleted = await resetSources();
              stats.push({ collection: 'sources', created: 0, updated: 0, skipped: 0, deleted });
              break;
            case 'payment_methods':
              deleted = await resetPaymentMethods();
              stats.push({ collection: 'payment_methods', created: 0, updated: 0, skipped: 0, deleted });
              break;
            case 'evidence_types':
              deleted = await resetEvidenceTypes();
              stats.push({ collection: 'evidence_types', created: 0, updated: 0, skipped: 0, deleted });
              break;
            default:
              console.warn(`Unknown collection for reset: ${collectionName}`);
          }
        }
        console.log('=================\n');
      }
    }
    
    // Seed reference collections first
    console.log('\n1/7 Seeding sources...');
    const sourcesStats = await seedSources();
    const sourceEntry = stats.find(s => s.collection === 'sources');
    if (sourceEntry) {
      sourceEntry.created = sourcesStats.created;
      sourceEntry.updated = sourcesStats.updated;
      sourceEntry.skipped = sourcesStats.skipped;
    } else {
      stats.push({ collection: 'sources', ...sourcesStats });
    }
    
    console.log('\n2/7 Seeding payment methods...');
    const paymentStats = await seedPaymentMethods();
    const paymentEntry = stats.find(s => s.collection === 'payment_methods');
    if (paymentEntry) {
      paymentEntry.created = paymentStats.created;
      paymentEntry.updated = paymentStats.updated;
      paymentEntry.skipped = paymentStats.skipped;
    } else {
      stats.push({ collection: 'payment_methods', ...paymentStats });
    }
    
    console.log('\n3/7 Seeding evidence types...');
    const evidenceStats = await seedEvidenceTypes();
    const evidenceEntry = stats.find(s => s.collection === 'evidence_types');
    if (evidenceEntry) {
      evidenceEntry.created = evidenceStats.created;
      evidenceEntry.updated = evidenceStats.updated;
      evidenceEntry.skipped = evidenceStats.skipped;
    } else {
      stats.push({ collection: 'evidence_types', ...evidenceStats });
    }
    
    // Migrate existing clients
    console.log('\n4/7 Migrating clients...');
    const migratedClients = await migrateClientsActiveField();
    if (migratedClients > 0) {
      stats.push({ collection: 'clients_migration', created: 0, updated: migratedClients, skipped: 0 });
    }
    
    // Original seeds
    console.log('\n5/7 Seeding products...');
    await seedProducts();
    stats.push({ collection: 'products', created: 0, updated: 0, skipped: 0 });
    
    console.log('\n6/7 Seeding vendors...');
    await seedVendors();
    stats.push({ collection: 'vendors', created: 0, updated: 0, skipped: 0 });
    
    console.log('\n7/7 Seeding sales (with clients)...');
    await seedSales({ adminUid });
    stats.push({ collection: 'sales', created: 0, updated: 0, skipped: 0 });
    
    // Print summary
    console.log('\n=== SEEDING SUMMARY ===');
    for (const stat of stats) {
      const parts = [`${stat.collection}:`];
      if (stat.deleted !== undefined && stat.deleted > 0) {
        parts.push(`deleted ${stat.deleted}`);
      }
      if (stat.created > 0) {
        parts.push(`created ${stat.created}`);
      }
      if (stat.updated > 0) {
        parts.push(`updated ${stat.updated}`);
      }
      if (stat.skipped > 0) {
        parts.push(`skipped ${stat.skipped}`);
      }
      if (parts.length === 1) {
        parts.push('no changes');
      }
      console.log(parts.join(' '));
    }
    console.log('=======================');
    
    console.log('\nDatabase seeding completed successfully!');
    
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}