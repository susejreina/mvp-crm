import Link from 'next/link';

const navigation = [
  { name: 'Escritorio', href: '/dashboard' },
  { name: 'Ventas', href: '/ventas' },
  { name: 'Clientes', href: '/clientes' },
  { name: 'Productos', href: '/productos' },
  { name: 'Vendedores', href: '/vendedores' },
];

export default function AppFooter() {
  return (
    <footer className="bg-blue-600 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">%</span>
            </div>
            <span className="ml-2 text-lg font-semibold">Academia de IA</span>
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