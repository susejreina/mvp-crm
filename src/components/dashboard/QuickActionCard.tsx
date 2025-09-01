import Link from 'next/link';

interface QuickActionCardProps {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export default function QuickActionCard({ title, href, icon }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <div className="bg-blue-600 text-white rounded-lg shadow p-6 hover:bg-blue-700 transition-colors h-full">
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <h3 className="text-lg font-semibold text-center">{title}</h3>
          {icon && <div className="text-6xl font-light">{icon}</div>}
        </div>
      </div>
    </Link>
  );
}