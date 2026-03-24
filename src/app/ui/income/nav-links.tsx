'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  RectangleStackIcon,
  PlusCircleIcon,
  ReceiptPercentIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

type NavItem = {
  label: string;
  href: string;
  match: "exact" | "prefix";
  exclude?: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: NavItem[] = [
  {
    label: "Dashboard",
    href: "/income",
    match: "exact",
    icon: ChartBarIcon,
  },
  {
    label: "Income List",
    href: "/income/list",
    match: "prefix",
    exclude: ["/income/list/create"],
    icon: RectangleStackIcon,
  },
  {
    label: "Batch Create",
    href: "/income/list/create",
    match: "prefix",
    icon: PlusCircleIcon,
  },
  {
    label: "Donation Receipts",
    href: "/income/receipt",
    match: "prefix",
    icon: ReceiptPercentIcon,
  },
  {
    label: "Member Tax Info",
    href: "/income/member",
    match: "prefix",
    icon: UsersIcon,
  },
];

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

const matchesPath = (pathname: string, href: string, match: NavItem["match"]) => {
  const path = normalize(pathname);
  const base = normalize(href);

  if (match === "exact") return path === base;

  return path === base || path.startsWith(`${base}/`);
};

const isActive = (pathname: string, item: NavItem) => {
  if (!matchesPath(pathname, item.href, item.match)) {
    return false;
  }

  if (!item.exclude?.length) {
    return true;
  }

  return !item.exclude.some((excludedPath) =>
    matchesPath(pathname, excludedPath, "prefix")
  );
};

const NavLinks = () => {
  const pathname = usePathname();  

  return (
    <nav>
      <div>
        <div className="sidebar-section-title">Navigation</div>
        <div className="space-y-5">
          {items.map((item) => {
            const active = isActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 text-sm',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
                  active
                    ? 'font-semibold text-slate-900'
                    : 'text-slate-500'
                )}                
              >
                <span
                  className={clsx(
                    'flex h-5 w-5 shrink-0 items-center justify-center',
                    active
                      ? 'text-slate-900'
                      : 'text-slate-400'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavLinks;
