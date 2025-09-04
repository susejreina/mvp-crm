/**
 * Alternative image handling using Base64 storage in Firestore
 * This avoids Firebase Storage CORS issues during development
 */

import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Convert file to Base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Validate and resize image file
 */
function validateAndResizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y WebP.'));
      return;
    }

    // Validate file size (max 2MB for Base64 storage)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      reject(new Error('El archivo es muy grande. Tamaño máximo: 2MB.'));
      return;
    }

    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set max dimensions
      const maxWidth = 200;
      const maxHeight = 200;
      
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, { type: file.type });
          resolve(resizedFile);
        } else {
          reject(new Error('Error al procesar la imagen.'));
        }
      }, file.type, 0.8); // 80% quality
    };

    img.onerror = () => reject(new Error('Error al cargar la imagen.'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Update vendor profile image using Base64 storage
 */
export async function updateVendorProfileImageBase64(
  vendorId: string, 
  imageFile: File
): Promise<string> {
  try {
    // Validate and resize image
    const resizedFile = await validateAndResizeImage(imageFile);
    
    // Convert to Base64
    const base64Image = await fileToBase64(resizedFile);
    
    // Update vendor document with Base64 image
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      photoUrl: base64Image,
      hasCustomPhoto: true,
      updatedAt: Timestamp.now(),
    });
    
    return base64Image;
  } catch (error) {
    console.error('Error updating vendor profile image:', error);
    throw error;
  }
}

/**
 * Remove vendor profile image
 */
export async function removeVendorProfileImageBase64(vendorId: string): Promise<void> {
  try {
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