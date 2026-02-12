import SideNav from "@/app/ui/income/sidenav";

const IncomeLayout = ({ children }: { children: React.ReactNode}) => {
    return (
        <div className='flex h-screen flex-col md:flex-row md:overflow-hidden'>
            <div className='w-full flex-none md:w-64'>
                <SideNav />
            </div>
            <div className='grow px-6 pt-2 pb-6 md:overflow-y-auto md:px-12 md:pt-4 mdLpb-12'>{ children }</div>
        </div>
    )
}

export default IncomeLayout;