import Link from 'next/link';
import Image from 'next/image';

const navigation = [
  { name: 'Escritorio', href: '/dashboard' },
  { name: 'Ventas', href: '/ventas' },
  { name: 'Clientes', href: '/clientes' },
  { name: 'Productos', href: '/productos' },
  { name: 'Vendedores', href: '/vendors' },
];

export default function AppFooter() {
  return (
    <footer className="bg-blue-600 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image 
              src="/assets/logo-white-min.svg" 
              alt="Academia de IA" 
              width={140} 
              height={32}
            />
          </div>

          {/* Footer Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-blue-100 hover:text-white text-sm transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Footer Navigation */}
        <div className="md:hidden mt-4 pt-4 border-t border-blue-500">
          <nav className="flex flex-wrap gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-blue-100 hover:text-white text-sm transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}