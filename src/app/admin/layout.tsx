import SideNav from "@/app/ui/admin/sidenav";

const AdminLayout = ({ children }: { children: React.ReactNode}) => {
    return (
        <div className='flex h-screen flex-col md:flex-row md:overflow-hidden'>
            <div className='w-full flex-none md:w-[280px]'>
                <SideNav />
            </div>
            <div className='grow px-6 pt-2 pb-6 md:overflow-y-auto md:px-12 md:pt-4 md:pb-12'>{ children }</div>
        </div>
    )
}

export default AdminLayout;
