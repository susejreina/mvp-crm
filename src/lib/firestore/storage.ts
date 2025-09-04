import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Upload profile image to Firebase Storage
 */
export async function uploadProfileImage(
  vendorId: string, 
  file: File
): Promise<string> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y WebP.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('El archivo es muy grande. Tamaño máximo: 5MB.');
  }

  // Create reference to storage location
  const imageRef = ref(storage, `profile-images/${vendorId}`);
  
  try {
    // Upload file
    const snapshot = await uploadBytes(imageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Error al subir la imagen. Intenta de nuevo.');
  }
}

/**
 * Delete profile image from Firebase Storage
 */
export async function deleteProfileImage(vendorId: string): Promise<void> {
  const imageRef = ref(storage, `profile-images/${vendorId}`);
  
  try {
    await deleteObject(imageRef);
  } catch (error) {
    // Ignore error if file doesn't exist
    if ((error as any)?.code !== 'storage/object-not-found') {
      console.error('Error deleting profile image:', error);
      throw new Error('Error al eliminar la imagen.');
    }
  }
}

/**
 * Generate a unique filename for profile image
 */
export function generateProfileImageName(vendorId: string, originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase();
  const timestamp = Date.now();
  return `${vendorId}-${timestamp}.${extension}`;
}