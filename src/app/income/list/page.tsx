
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import Link from "next/link"; 
import { fetchFilteredIncome, getIncomeMethods, getIncomeTypes } from "@/app/lib/data";
import PageIntro from "@/app/ui/page-intro";

import SearchBox from "@/app/ui/income/search-box";
import Pagination from "@/app/ui/income/pagination";
import Table from "@/app/ui/income/table";
import { toInt } from "@/app/lib/utils";
import DateFilters from "@/app/ui/income/date-filters";
import { canAccessFinance, requireFinanceAccess } from '@/app/lib/auth';
import { buttonVariants } from "@/components/ui/button";

const IncomeList = async (props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    year?: string;
    month?: string;
    day?: string;
  }>;
}) => {  
  await requireFinanceAccess({ nextPath: '/income/list' });

  const searchParams = await props.searchParams;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const selectedYear = toInt(searchParams?.year) ?? currentYear;
  const selectedMonth = toInt(searchParams?.month) ?? 0;
  const selectedDay = toInt(searchParams?.day) ?? 0;

  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const [{ data, pagination }, incomeTypes, incomeMethods, canManageFinance] = await Promise.all([
    fetchFilteredIncome(query, currentPage, selectedYear, selectedMonth, selectedDay),
    getIncomeTypes(),
    getIncomeMethods(),
    canAccessFinance(),
  ]);

   const totalPages = pagination.totalPages;

   const exportHref =
      `/api/income/export?year=${selectedYear}` +
      (selectedMonth ? `&month=${selectedMonth}` : "") +
      (selectedDay ? `&day=${selectedDay}` : "") +
      (query ? `&query=${encodeURIComponent(query)}` : "");


  return (
    <main className="space-y-6">
      <PageIntro
        title="Income List"
        description="Filter by date, search individual members, export the current slice, or jump into batch entry."
        actions={
          <>
            <Link href={exportHref} className={buttonVariants({ variant: "secondary" })}>
              Export Excel
            </Link>
            <Link href='/income/list/create' className={buttonVariants({ variant: "default" })}>
              <RectangleStackIcon width={20} height={20} />
              Create Batch Income
            </Link>
          </>
        }
      />

      <div className='toolbar-panel flex flex-col gap-4'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div className='flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end'>
            <DateFilters 
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedDay={selectedDay}
              years={years}
            />  

            <div className='w-full xl:min-w-[340px] xl:flex-1'>
              <SearchBox 
                selectedYear={selectedYear} 
                initialQuery={query} 
                clearKeys={['month', 'day', 'query', 'page']}
                placeholder='Search member or notes...'
              />
            </div>
          </div>
        </div>
      </div>

      <Table 
        incomeList={data} 
        incomeTypes={incomeTypes}
        incomeMethods={incomeMethods}
        canUpdateIncome={canManageFinance}
        canDeleteIncome={canManageFinance}
      />
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </main>
  )
}

export default IncomeList;
