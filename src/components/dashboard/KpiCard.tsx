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
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        {icon && <div className="flex-shrink-0 mr-3">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          
          {loading && (
            <div className="mt-1">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              {subtitle && <div className="h-4 bg-gray-200 rounded mt-2 w-20 animate-pulse"></div>}
            </div>
          )}
          
          {error && (
            <div className="mt-1">
              <p className="text-sm text-red-600">Error loading data</p>
            </div>
          )}
          
          {!loading && !error && (
            <>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </>
          )}
        </div>
      </div>
      
      {href && !loading && !error && (
        <div className="mt-4">
          <p className="text-sm text-blue-600 hover:text-blue-500">
            Ver {title.toLowerCase()} →
          </p>
        </div>
      )}
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