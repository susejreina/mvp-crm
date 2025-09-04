// Quick script to create admin vendor user in Firestore
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to add your service account key
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createAdminVendor() {
  try {
    const email = 'susejreina@gmail.com';
    const name = 'Suse J Reina';
    
    // Generate vendor ID from email (same logic as createVendor)
    const vendorId = email.toLowerCase()
      .replace(/[^a-z0-9@.]/g, '-')
      .replace(/@/g, '-')
      .replace(/\./g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    console.log('Creating vendor with ID:', vendorId);

    await db.collection('vendors').doc(vendorId).set({
      name: name,
      email: email,
      role: 'admin',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ Admin vendor created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔑 Role: admin');
    console.log('✅ Active: true');
    console.log('🆔 Vendor ID:', vendorId);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin vendor:', error);
    process.exit(1);
  }
}

createAdminVendor();