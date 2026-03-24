import Link from 'next/link';
import NavLinks from '@/app/ui/admin/nav-links';
import SignOutButton from '@/app/ui/auth/sign-out-button';
import { getSession } from '@/app/lib/auth';
import { getInitials } from '@/app/lib/utils';

const formatRole = (roleCode: string) => {
  switch (roleCode) {
    case 'super':
      return 'Super Admin';
    case 'treasurer':
      return 'Treasurer';
    case 'pastor':
      return 'Pastor';
    default:
      return 'Administrator';
  }
};

const SideNav = async () => {
  const session = await getSession();
    const accountLabel = session?.name?.trim() || session?.email || 'finance@rkac';
    const roleLabel = session?.roleCodes?.length
      ? session.roleCodes.map(formatRole).join(', ')
      : 'Finance User';
    const avatarLabel = getInitials(accountLabel);

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-transparent px-6 py-6 md:px-7">        
      <div className="space-y-1">
        <Link
          href="/admin"
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">Admin</div>
        </Link>
        <Link
          href="/"
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="text-sm text-slate-500">RKAC Finance</div>
        </Link>
      </div>


      <div className="flex grow flex-col pt-12">
        <NavLinks />

        <div className="mt-auto border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {avatarLabel}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">{accountLabel}</div>
              <div className="mt-1 text-sm text-slate-500">{roleLabel}</div>
            </div>
            <SignOutButton iconOnly label="Sign out" className="shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
