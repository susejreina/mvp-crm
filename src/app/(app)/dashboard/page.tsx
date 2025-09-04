'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getTotalApprovedUsd, getClientsCount, getActiveProductsCount, getSellersCount } from '@/lib/dashboard/queries';
import { authService } from '@/lib/auth/service';
import { getVendorByEmail } from '@/lib/firestore/auth';
import { Vendor } from '@/lib/types';
import KpiCard from '@/components/dashboard/KpiCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';
import SaleKindModal from '@/components/sales/SaleKindModal';

interface DashboardMetrics {
  totalApprovedUsd: number;
  clientsCount: number;
  activeProductsCount: number;
  sellersCount: number;
}

interface LoadingStates {
  totalApprovedUsd: boolean;
  clientsCount: boolean;
  activeProductsCount: boolean;
  sellersCount: boolean;
}

interface ErrorStates {
  totalApprovedUsd: string | null;
  clientsCount: string | null;
  activeProductsCount: string | null;
  sellersCount: string | null;
}

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApprovedUsd: 0,
    clientsCount: 0,
    activeProductsCount: 0,
    sellersCount: 0,
  });

  const [loading, setLoading] = useState<LoadingStates>({
    totalApprovedUsd: true,
    clientsCount: true,
    activeProductsCount: true,
    sellersCount: true,
  });

  const [errors, setErrors] = useState<ErrorStates>({
    totalApprovedUsd: null,
    clientsCount: null,
    activeProductsCount: null,
    sellersCount: null,
  });

  const loadMetrics = async () => {
    const promises = [
      getTotalApprovedUsd(db).then(
        (value) => {
          setMetrics(prev => ({ ...prev, totalApprovedUsd: value }));
          setLoading(prev => ({ ...prev, totalApprovedUsd: false }));
        },
        (error) => {
          setErrors(prev => ({ ...prev, totalApprovedUsd: error.message }));
          setLoading(prev => ({ ...prev, totalApprovedUsd: false }));
        }
      ),
        getClientsCount(db).then(
          (value) => {
            setMetrics(prev => ({ ...prev, clientsCount: value }));
            setLoading(prev => ({ ...prev, clientsCount: false }));
          },
          (error) => {
            setErrors(prev => ({ ...prev, clientsCount: error.message }));
            setLoading(prev => ({ ...prev, clientsCount: false }));
          }
        ),
        getActiveProductsCount(db).then(
          (value) => {
            setMetrics(prev => ({ ...prev, activeProductsCount: value }));
            setLoading(prev => ({ ...prev, activeProductsCount: false }));
          },
          (error) => {
            setErrors(prev => ({ ...prev, activeProductsCount: error.message }));
            setLoading(prev => ({ ...prev, activeProductsCount: false }));
          }
        ),
        getSellersCount(db).then(
          (value) => {
            setMetrics(prev => ({ ...prev, sellersCount: value }));
            setLoading(prev => ({ ...prev, sellersCount: false }));
          },
          (error) => {
            setErrors(prev => ({ ...prev, sellersCount: error.message }));
            setLoading(prev => ({ ...prev, sellersCount: false }));
          }
        ),
      ];

      await Promise.all(promises);
    };

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

  useEffect(() => {
    loadMetrics();
    loadCurrentVendor();
  }, []);

  // Refresh metrics when window gains focus (user returns from another page)
  useEffect(() => {
    const handleFocus = () => {
      loadMetrics();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hola {currentVendor ? currentVendor.name : 'Usuario'}
        </h1>
        <p className="text-gray-600">
          {currentVendor?.position || 'Sin cargo asignado'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Action Card */}
        <QuickActionCard
          title="Añadir Nueva venta"
          onClick={() => setModalOpen(true)}
          icon={<span className="text-6xl font-light">+</span>}
        />

        {/* Total Approved USD Sales */}
        <KpiCard
          title="Ventas totales"
          value={loading.totalApprovedUsd ? '' : formatCurrency(metrics.totalApprovedUsd)}
          subtitle="USD"
          href="/ventas"
          loading={loading.totalApprovedUsd}
          error={errors.totalApprovedUsd}
          icon={
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                <path d="M6 8h8v2H6V8zm0 4h5v2H6v-2z"/>
              </svg>
            </div>
          }
        />

        {/* Total Clients */}
        <KpiCard
          title="Clientes totales"
          value={loading.clientsCount ? '' : metrics.clientsCount}
          subtitle="Clientes"
          loading={loading.clientsCount}
          error={errors.clientsCount}
          icon={
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
          }
        />

        {/* Products on Sale */}
        <KpiCard
          title="Productos en venta"
          value={loading.activeProductsCount ? '' : metrics.activeProductsCount}
          subtitle="Productos"
          loading={loading.activeProductsCount}
          error={errors.activeProductsCount}
          icon={
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5zM6 9a1 1 0 012 0v3a1 1 0 11-2 0V9zm6 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clipRule="evenodd"/>
              </svg>
            </div>
          }
        />

        {/* Vendors */}
        <KpiCard
          title="Vendedores"
          value={loading.sellersCount ? '' : metrics.sellersCount}
          subtitle="Comerciales"
          href="/vendedores"
          loading={loading.sellersCount}
          error={errors.sellersCount}
          icon={
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2V4zm2 0h8a2 2 0 012 2v8a2 2 0 01-2 2H6V4zm6 4a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd"/>
              </svg>
            </div>
          }
        />
      </div>

      {/* Sale Kind Modal */}
      <SaleKindModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  );
}