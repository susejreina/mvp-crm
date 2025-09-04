'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { authService } from '@/lib/auth/service';
import { getVendorByEmail } from '@/lib/firestore/auth';
import { Vendor } from '@/lib/types';
import { LogOut, ChevronDown } from 'lucide-react';
import Avatar from '../ui/Avatar';

const navigation = [
  { name: 'Escritorio', href: '/dashboard' },
  { name: 'Ventas', href: '/ventas' },
  { name: 'Clientes', href: '/clientes' },
  { name: 'Productos', href: '/productos' },
  { name: 'Vendedores', href: '/vendors' },
];

export default function AppHeader() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Load current vendor data
  useEffect(() => {
    const loadCurrentVendor = async () => {
      const user = await new Promise((resolve) => {
        const unsubscribe = authService.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      });

      if (user && (user as any).email) {
        const vendor = await getVendorByEmail((user as any).email);
        setCurrentVendor(vendor);
      }
    };

    loadCurrentVendor();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      // AuthGate will handle redirecting to login
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image 
                src="/assets/logo-blue.svg" 
                alt="Academia de IA" 
                width={140} 
                height={32}
              />
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/dashboard' && pathname === '/escritorio');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center relative">
            <div ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="mr-2">
                  {currentVendor ? (
                    <Avatar
                      src={currentVendor.photoUrl}
                      googleSrc={currentVendor.googlePhotoUrl}
                      name={currentVendor.name}
                      size="sm"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm">👤</span>
                    </div>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
          <nav className="flex flex-col space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href === '/dashboard' && pathname === '/escritorio');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}