// Script to create admin vendor user
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

// Firebase config (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

    const vendorRef = doc(db, 'vendors', vendorId);
    
    await setDoc(vendorRef, {
      name: name,
      email: email,
      role: 'admin',
      active: true,
      createdAt: Timestamp.now(),
    });
    
    console.log('Admin vendor created successfully!');
    console.log('Vendor ID:', vendorId);
    console.log('Email:', email);
    console.log('Role: admin');
    console.log('Active: true');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin vendor:', error);
    process.exit(1);
  }
}

createAdminVendor();