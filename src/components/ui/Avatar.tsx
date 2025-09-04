'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string;
  googleSrc?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export default function Avatar({ src, googleSrc, name, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [googleImageError, setGoogleImageError] = useState(false);

  // Get initials from name
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine which image to show (priority: custom -> Google -> initials)
  const imageToShow = !imageError && src ? src : (!googleImageError && googleSrc ? googleSrc : null);

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-medium ${className}`;

  if (imageToShow) {
    return (
      <div className={`${baseClasses} overflow-hidden bg-gray-100`}>
        <Image
          src={imageToShow}
          alt={`${name} avatar`}
          width={64}
          height={64}
          className="w-full h-full object-cover"
          onError={() => {
            if (imageToShow === src) {
              setImageError(true);
            } else {
              setGoogleImageError(true);
            }
          }}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
      {getInitials(name)}
    </div>
  );
}