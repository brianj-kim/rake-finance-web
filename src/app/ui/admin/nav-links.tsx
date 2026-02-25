'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  TagIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

type NavItem = {
  label: string;
  href: string;
  activePrefixes: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: NavItem[] = [
  { label: "Admin Dashboard", href: "/admin", activePrefixes: ["/admin"], icon: Squares2X2Icon },
  { label: "Admin Accounts", href: "/admin/admins", activePrefixes: ["/admin/admins"], icon: UserGroupIcon },
  { label: "Charity Profile", href: "/admin/charity", activePrefixes: ["/admin/charity"], icon: BuildingOffice2Icon },
  { label: "Categories", href: "/admin/categories", activePrefixes: ["/admin/categories"], icon: TagIcon },
]

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

const isActive = (pathname: string, href: string, activePrefixes: string[]) => {
  const path = normalize(pathname);
  const bases = (activePrefixes?.length ? activePrefixes : [href]).filter(Boolean).map(normalize);
  return bases.includes(path) || bases.some((b) => b !== '/admin' && path.startsWith(b));
};

const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav className='flex flex-col gap-1 px-1'>
      {items.map((item) => (
        <Link 
          key={item.href}
          href={item.href}
          className={clsx(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2",
            isActive(pathname, item.href, item.activePrefixes)
              ? "bg-purple-50 text-purple-700"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-purple-700"
          )}
        >
          <item.icon className='h-5 w-5 shrink-0' />
          <span className='truncate'>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default NavLinks;