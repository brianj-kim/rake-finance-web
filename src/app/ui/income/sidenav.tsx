import Link from "next/link";
import NavLinks from "@/app/ui/income/nav-links";
import SignOutButton from "@/app/ui/auth/sign-out-button";

const SideNav = () => {
  return (
    <aside className="flex h-full flex-col px-3 py-4 md:px-2">
      {/* Brand / Module Header */}
      <Link
        href="/"
        className="mb-3 block rounded-md border border-gray-200 bg-white shadow-sm
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <div className="rounded-md bg-blue-600 px-4 py-3 border-b border-gray-200">
          <div className="text-base font-semibold text-white truncate">
            RKAC Finance
          </div>
          <div className="text-white text-sm truncate">
            / Income Module
          </div>
        </div>
      </Link>

      {/* Navigation block */}
      <div className="flex grow flex-col gap-3">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Navigation
            </div>
          </div>

          <div className="px-2 py-2">
            <NavLinks />
          </div>
        </div>

        {/* Spacer (keeps layout similar to your current side layout) */}
        <div className="hidden grow rounded-lg border border-gray-200 bg-gray-50 md:block" />

        {/* Sign out block */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Account
            </div>
          </div>

          <div className="px-2 py-2">
            <SignOutButton
              className="w-full inline-flex items-center md:justify-start gap-2
                         rounded-md bg-gray-50 px-3 py-2 text-sm font-medium
                         hover:bg-gray-100 hover:text-blue-700
                         disabled:opacity-60"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;


// import Link from 'next/link';
// import NavLinks from '@/app/ui/income/nav-links';
// import SignOutButton from '@/app/ui/auth/sign-out-button';

// const SideNav = () => {
//     return (
//         <div className="flex h-full flex-col px-3 py-4 md:px-2">
//             <Link
//                 className="mb-2 flex h-10 items-end justify-start rounded-md bg-blue-600 p-4 md:h-20"
//                 href="/"
//             >
//                 <div className="w-32 text-white md:w-40">
//                 RKAC-Finance / Income
//                 </div>
//             </Link>

//             <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
//                 <NavLinks />
//                 <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
//                 <SignOutButton className='md:justify-start' />
//             </div>
            
//         </div>
//     );
// }

// export default SideNav;