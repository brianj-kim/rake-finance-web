'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  BuildingOffice2Icon,
  TagIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

type NavItem = {
  label: string;
  href: string;
  match: "exact" | "prefix";
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    match: "exact",
    icon: Squares2X2Icon,
  },
  {
    label: "Charity Profile",
    href: "/admin/charity",
    match: "prefix",
    icon: BuildingOffice2Icon,
  },
  {
    label: "Category Admin",
    href: "/admin/category",
    match: "prefix",
    icon: TagIcon,
  },
]

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

const isActive = (pathname: string, href: string, match: NavItem["match"]) => {
  const path = normalize(pathname);
  const base = normalize(href);

  if (match === "exact") return path === base;

  return path === base || path.startsWith(`${base}/`);
};

const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav>
      <div>
        <div className='sidebar-section-title'>Navigation</div>
        <div className='space-y-5'>
          {items.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 text-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0",
                isActive(pathname, item.href, item.match)
                  ? "font-semibold text-slate-900"
                  : "text-slate-500"
              )}
            >
              <span
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center",
                  isActive(pathname, item.href, item.match)
                    ? "text-slate-900"
                    : "text-slate-400"
                )}
              >
                <item.icon className='h-5 w-5 shrink-0' />
              </span>
              <span className='truncate'>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default NavLinks;
