
import { fetchLatestIncome } from "@/app/lib/data";
import { formatCurrency } from "@/app/lib/utils";
import { lusitana } from "@/app/ui/fonts";
import clsx from "clsx";


type LatestIncomeProps = {
    selectedYear: number;
}

const LatestIncome = async ({ selectedYear }: LatestIncomeProps) => {
    const latestIncome = await fetchLatestIncome(selectedYear);

    return (
        <div className='flex w-full flex-col md:cols-span-4'>
            <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
                Latest Income
            </h2>
            <div className='flex grow flex-col justify-between rounded-xl bg-gray-50 p-4'>
                <div className='bg-white px-6'>
                    {latestIncome.map((inc, i) => {
                        return (
                            <div 
                                key={inc.inc_id}
                                className={clsx(
                                    'flex flex-row items-center justify-between py-4',
                                    {
                                        'border-t': i !== 0,
                                    },
                                )}
                            >
                                <div className="flex items-center">
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-semibold md:text-base'>
                                            {inc.name}
                                        </p>
                                        <p className='hidden text-sm text-gray-500 sm:block'>
                                            {inc.type}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-center justify-start'>
                                    {`${inc.year}-${inc.month}-${inc.day} `}
                                </div>
                                <p className={`${lusitana.className} truncate text-sm font-medium md:text-base`} >
                                    {formatCurrency(inc.amount!/100)}
                                </p>                  
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


export default LatestIncome;