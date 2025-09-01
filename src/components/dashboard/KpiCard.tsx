import Link from 'next/link';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  href,
  onClick,
  icon,
  loading = false,
  error
}: KpiCardProps) {
  const content = (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow h-full">
      <div className="flex flex-col h-full">
        {/* Icon in top left */}
        {icon && <div className="flex justify-start mb-4">{icon}</div>}
        
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 mb-2">{title}</p>
          
          {loading && (
            <div>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              {subtitle && <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>}
            </div>
          )}
          
          {error && (
            <div>
              <p className="text-sm text-red-600">Error loading data</p>
            </div>
          )}
          
          {!loading && !error && (
            <>
              <p className="text-2xl font-normal text-gray-900 mb-1">{value}</p>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </>
          )}
        </div>
      
        {href && !loading && !error && (
          <div className="mt-4">
            <p className="text-sm text-blue-600 hover:text-blue-500">
              {title === 'Ventas totales' ? 'Ver ventas' : `Ver ${title.toLowerCase()}`} →
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (href && !loading && !error) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick && !loading && !error) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>;
  }

  return content;
}