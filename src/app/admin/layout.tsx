import SideNav from "@/app/ui/admin/sidenav";
import { requireAdminAccess } from "@/app/lib/auth";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAdminAccess({ nextPath: '/admin' });

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="grow px-6 pt-2 pb-6 md:overflow-y-auto md:px-12 md:pt-4 md:pb-12">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
