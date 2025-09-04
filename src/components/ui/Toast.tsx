'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${
        type === 'success'
          ? 'bg-green-100 border border-green-200 text-green-800'
          : 'bg-red-100 border border-red-200 text-red-800'
      }`}
    >
      <div className="flex items-center">
        {type === 'success' ? (
          <CheckCircle className="h-5 w-5 mr-2" />
        ) : (
          <XCircle className="h-5 w-5 mr-2" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={handleClose}
        className={`ml-4 text-lg font-bold leading-none ${
          type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
        }`}
      >
        ×
      </button>
    </div>
  );
}