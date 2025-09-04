'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Avatar from './Avatar';
import Button from './Button';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  googleImageUrl?: string;
  userName: string;
  onImageUpload: (file: File) => Promise<string>;
  onImageRemove?: () => Promise<void>;
  className?: string;
}

export default function ProfileImageUpload({
  currentImageUrl,
  googleImageUrl,
  userName,
  onImageUpload,
  onImageRemove,
  className = ''
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      await onImageUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!onImageRemove) return;

    setError(null);
    setRemoving(true);

    try {
      await onImageRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la imagen');
    } finally {
      setRemoving(false);
    }
  };

  const hasCustomImage = !!currentImageUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="relative">
        <Avatar
          src={currentImageUrl}
          googleSrc={googleImageUrl}
          name={userName}
          size="xl"
        />
        
        {/* Upload Button Overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || removing}
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 
                   rounded-full flex items-center justify-center transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-white" />
            )}
          </div>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || removing}
          className="text-xs"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-3 w-3 mr-1" />
              {hasCustomImage ? 'Cambiar' : 'Subir foto'}
            </>
          )}
        </Button>

        {hasCustomImage && onImageRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={uploading || removing}
            className="text-xs text-red-600 hover:text-red-700"
          >
            {removing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Eliminar
              </>
            )}
          </Button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 text-center max-w-xs">
          {error}
        </p>
      )}

      {/* Help Text */}
      {!error && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Sube una imagen JPG, PNG o WebP (máx. 5MB)
        </p>
      )}
    </div>
  );
}