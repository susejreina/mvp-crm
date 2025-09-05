'use client';

import { useState } from 'react';
import { X, Copy, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

interface VendorCreatedModalProps {
  vendorName: string;
  vendorEmail: string;
  tempPassword: string;
  onClose: () => void;
}

export default function VendorCreatedModal({ 
  vendorName, 
  vendorEmail, 
  tempPassword,
  onClose 
}: VendorCreatedModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(vendorEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Acceso al Sistema CRM');
    const body = encodeURIComponent(
      `Hola ${vendorName},\n\n` +
      `Se ha creado tu cuenta en el sistema CRM.\n\n` +
      `Tus credenciales de acceso son:\n` +
      `Email: ${vendorEmail}\n` +
      `Contraseña temporal: ${tempPassword}\n\n` +
      `Por favor, cambia tu contraseña en el primer inicio de sesión.\n\n` +
      `Puedes acceder al sistema en: ${window.location.origin}/login\n\n` +
      `Saludos,\nEl equipo de CRM`
    );
    window.open(`mailto:${vendorEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Vendedor Creado</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              El vendedor <strong>{vendorName}</strong> ha sido creado exitosamente.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={vendorEmail}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
                <button
                  onClick={handleCopyEmail}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copiar email"
                >
                  {copiedEmail ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña temporal
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={tempPassword}
                    readOnly
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900"
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Copiar contraseña"
                >
                  {copiedPassword ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Importante:</strong> Se ha enviado un correo electrónico al vendedor con un enlace para 
              restablecer su contraseña. También puedes compartir estas credenciales temporales de forma segura.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleSendEmail}
              className="inline-flex items-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
            <Button
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}