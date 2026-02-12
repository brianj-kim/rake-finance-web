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

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    title: "Income",
    items: [
      { label: "Dashboard", href: "/income", icon: ChartBarIcon },
      { label: "Income List", href: "/income/list", icon: RectangleStackIcon },
      { label: "Batch Create", href: "/income/list/create", icon: PlusCircleIcon },
    ],
  },
  {
    title: "Receipts",
    items: [
      { label: "Donation Receipts", href: "/income/receipt", icon: ReceiptPercentIcon },
      // If you have manage page:
      // { label: "Manage Receipts", href: "/income/receipt/manage", icon: WrenchScrewdriverIcon },
    ],
  },
  {
    title: "Members",
    items: [{ label: "Member Admin", href: "/income/member", icon: UsersIcon }],
  },
];

const isActive = (pathname: string, href: string) => {
  // "StartsWith" works well for sections like /income/list/...
  if (href === "/income") return pathname === "/income";
  return pathname === href || pathname.startsWith(href + "/");
};

const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-3">
      {groups.map((g) => (
        <div key={g.title} className="px-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {g.title}
          </div>

          <div className="flex flex-col gap-1">
            {g.items.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-blue-700",
                  ].join(" ")}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default NavLinks;


// import {
//   DocumentDuplicateIcon,
//   HomeIcon,
//   InboxArrowDownIcon,
//   UserGroupIcon,
// } from '@heroicons/react/24/outline';
// import clsx from 'clsx';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';

// const links = [
//   { name: 'Income Dashboard', href: '/income', icon: HomeIcon, activePrefixes: ['/'] },
//   { name: 'Income List', href: '/income/list', icon: InboxArrowDownIcon, activePrefixes: ['/income/list'] },
//   { name: 'Donation Receipt', href: '/income/receipt', icon: DocumentDuplicateIcon, activePrefixes: ['/income/receipt'] },
//   { name: 'Church Member', href: '/income/member', icon: UserGroupIcon, activePrefixes: ['/income/member'] }

// ]

// const NavLinks = () => {
//   const pathname = usePathname();
//   return (
//     <>
//       {links.map((link) => {
//         const LinkIcon = link.icon;

//         const isActive = link.activePrefixes.some(
//           (p) => pathname === p || pathname.startsWith(p + '/')
//         );
//         return (
//           <Link
//             key={link.name}
//             href={link.href}
//             className={clsx(
//               'flex h-12 grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
//               {'bg-sky-100 text-blue-600': isActive }
//             )}
//             >
//               <LinkIcon className='w-6' />
//               <p className='hidden md:block'>{link.name}</p>
//             </Link>
//         );
//       })}       
//     </>
//   )
// }

// export default NavLinks;