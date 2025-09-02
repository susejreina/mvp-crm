'use client';

import { formatCurrency } from '../../lib/utils/csvExport';

interface SalesKPIsProps {
  pendingCount: number;
  approvedCount: number;
  pendingAmount: number;
  approvedAmount: number;
  loading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  subvalue: string;
  color: 'orange' | 'green';
  loading?: boolean;
}

function KPICard({ title, value, subvalue, color, loading }: KPICardProps) {
  const colorClasses = {
    orange: {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    green: {
      text: 'text-green-600', 
      bg: 'bg-green-50',
      border: 'border-green-200'
    }
  };

  const classes = colorClasses[color];

  if (loading) {
    return (
      <div className={`${classes.bg} ${classes.border} border rounded-lg p-6`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes.bg} ${classes.border} border rounded-lg p-6`}>
      <h3 className={`text-sm font-medium ${classes.text} mb-2`}>
        {title}
      </h3>
      <div className={`text-2xl font-bold ${classes.text} mb-1`}>
        {value}
      </div>
      <div className={`text-sm ${classes.text}`}>
        {subvalue}
      </div>
    </div>
  );
}

export default function SalesKPIs({
  pendingCount,
  approvedCount, 
  pendingAmount,
  approvedAmount,
  loading = false
}: SalesKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <KPICard
        title="Ventas por aprobar"
        value={pendingCount.toLocaleString()}
        subvalue={formatCurrency(pendingAmount)}
        color="orange"
        loading={loading}
      />
      
      <KPICard
        title="Ventas aprobadas" 
        value={approvedCount.toLocaleString()}
        subvalue={formatCurrency(approvedAmount)}
        color="green"
        loading={loading}
      />
    </div>
  );
}