'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getTotalApprovedUsd, getClientsCount, getActiveProductsCount, getSellersCount } from '@/lib/dashboard/queries';
import KpiCard from '@/components/dashboard/KpiCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';

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

  useEffect(() => {
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

    loadMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hola Angela Ojeda</h1>
        <p className="text-gray-600">Director Comercial</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Action Card */}
        <QuickActionCard
          title="Añadir Nueva venta"
          href="/ventas/nueva"
          icon={<span className="text-4xl">+</span>}
        />

        {/* Total Approved USD Sales */}
        <KpiCard
          title="Ventas totales manual"
          value={loading.totalApprovedUsd ? '' : formatCurrency(metrics.totalApprovedUsd)}
          subtitle="USD"
          href="/ventas"
          loading={loading.totalApprovedUsd}
          error={errors.totalApprovedUsd}
          icon={
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">💰</span>
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
              <span className="text-green-600">👥</span>
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
              <span className="text-purple-600">🛒</span>
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
              <span className="text-orange-600">🏢</span>
            </div>
          }
        />
      </div>
    </div>
  );
}