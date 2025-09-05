import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, position } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 
                         Math.random().toString(36).slice(-8).toUpperCase() + 
                         '!@#';

    try {
      // Create user in Firebase Authentication
      const userRecord = await adminAuth().createUser({
        email,
        password: tempPassword,
        displayName: name,
        emailVerified: false,
      });

      // Set custom claims for the user
      await adminAuth().setCustomUserClaims(userRecord.uid, {
        role: role,
        vendorId: userRecord.uid,
      });

      // Generate vendor ID from email (slug format)
      const vendorId = email.toLowerCase()
        .replace(/[^a-z0-9@.]/g, '-')
        .replace(/@/g, '-')
        .replace(/\./g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Create vendor document in Firestore
      await adminDb().collection('vendors').doc(vendorId).set({
        name,
        email,
        role,
        position: position || 'Vendedor',
        active: true,
        authUid: userRecord.uid,
        createdAt: new Date(),
      });

      // Send password reset email so user can set their own password
      const resetLink = await adminAuth().generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      });

      return NextResponse.json({
        success: true,
        vendorId,
        authUid: userRecord.uid,
        resetLink,
        tempPassword,
        message: 'Vendor created successfully. A password reset email has been sent.',
      });

    } catch (authError: any) {
      console.error('Error creating user in Firebase Auth:', authError);
      
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }
      
      throw authError;
    }

  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}