'use client';

import {
  DocumentDuplicateIcon,
  HomeIcon,
  InboxArrowDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'Income Dashboard', href: '/income', icon: HomeIcon, activePrefixes: ['/'] },
  { name: 'Income List', href: '/income/list', icon: InboxArrowDownIcon, activePrefixes: ['/income/list'] },
  { name: 'Donation Receipt', href: '/income/receipt', icon: DocumentDuplicateIcon, activePrefixes: ['/income/receipt'] },
  { name: 'Church Member', href: '/income/member', icon: UserGroupIcon, activePrefixes: ['/income/member'] }

]

const NavLinks = () => {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;

        const isActive = link.activePrefixes.some(
          (p) => pathname === p || pathname.startsWith(p + '/')
        );
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-12 grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {'bg-sky-100 text-blue-600': isActive }
            )}
            >
              <LinkIcon className='w-6' />
              <p className='hidden md:block'>{link.name}</p>
            </Link>
        );
      })}       
    </>
  )
}

export default NavLinks;