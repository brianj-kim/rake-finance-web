import Link from 'next/link';
import NavLinks from '@/app/ui/admin/nav-links';
import SignOutButton from '@/app/ui/auth/sign-out-button';

const SideNav = () => {
  return (
    <aside className='flex h-full flex-col px-3 py-4 md:px-2'>
      <Link
        href='/'
        className='mb-3 block rounded-md border border-gray-200 bg-white shaow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2'
      >
        <div className='rounded-md bg-purple-600 px-4 py-3 border-b border-gray-200'>
          <div className='text-lg font-sesmibold text-white truncate'>RKAC Finance</div>
          <div className='text-white text-base truncate'>/Admin</div>
        </div>
      </Link>

      <div className='flex grow flex-col gap-3'>
        <div className='rounded-lg border border-gray-200 bg-white shaodw-sm overflow-hidden'>
          <div className='bg-gray-100 px-4 py-3 border-b border-gray-200'>
            <div className='text-xs font-semibold text-gray-700 uppercases tracking-wide'>
              Navigation
            </div>
          </div>
          <div className='px-2 py-2'>
            <NavLinks />
          </div>
        </div>

        <div className='hidden grow rounded-lg border border-gray-200 bg-gray-50 md:block' />

        <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
          <div className='bg-gray-100 px-4 py-3 border-b- border-gray-200'>
            <div className='text-xs font-semibold text-gray-700 uppercase tracking-wide'>
              Account
            </div>
          </div>

          <div className='px-2 py-2'>
            <SignOutButton 
              className='w-full inline-flex items-center md:justify-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium hover:bg-gray-100 hover:text-purple-700 disabled:opacity-60'
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

export default SideNav;