
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import Link from "next/link"; 
import { fetchFilteredIncome, getIncomeMethods, getIncomeTypes } from "@/app/lib/data";
import { lusitana } from "@/app/ui/fonts";

import SearchBox from "@/app/ui/income/search-box";
import Pagination from "@/app/ui/income/pagination";
import Table from "@/app/ui/income/table";
import { toInt } from "@/app/lib/utils";
import DateFilters from "@/app/ui/income/date-filters";

const IncomeList = async (props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    year?: string;
    month?: string;
    day?: string;
  }>;
}) => {  
  const searchParams = await props.searchParams;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const selectedYear = toInt(searchParams?.year) ?? currentYear;
  const selectedMonth = toInt(searchParams?.month) ?? 0;
  const selectedDay = toInt(searchParams?.day) ?? 0;

  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const [{ data, pagination }, incomeTypes, incomeMethods] = await Promise.all([
    fetchFilteredIncome(query, currentPage, selectedYear, selectedMonth, selectedDay),
    getIncomeTypes(),
    getIncomeMethods(),
  ]);

   const totalPages = pagination.totalPages;

   const exportHref =
      `/api/income/export?year=${selectedYear}` +
      (selectedMonth ? `&month=${selectedMonth}` : "") +
      (selectedDay ? `&day=${selectedDay}` : "") +
      (query ? `&query=${encodeURIComponent(query)}` : "");


  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Income List</h1>
      <div className='w-full flex flex-col gap-3 items-stretch md:flex-row md:items-end'>
        <div className='w-full flex flex-col gap-3 items-center sm:flex-row sm:flex-wrap sm:items-end md:justify-start'>
          <DateFilters 
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
            years={years}
          />  

          <div className='w-full sm:flex-1'>
            <SearchBox 
              selectedYear={selectedYear} 
              initialQuery={query} 
              clearKeys={['month', 'day', 'query', 'page']}
              placeholder='Search Member...'
            />
          </div>
        </div>

        <div className='flex w-full md:w-auto md:justify-end'>
          <Link
            href={exportHref}
            className="flex flex-1 shrink-0 items-center gap-2 whitespace-nowrap md:flex-none rounded-md border border-gray-200 bg-sky-100 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-sky-100"
          >
            Export Excel
          </Link>
        </div>

        <div className='flex w-full md:w-auto md:justify-end'>
          <Link 
            href='/income/list/create' 
            className='flex flex-1 shrink-0 items-center gap-2 whitespace-nowrap md:flex-none rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white'
          >
            <RectangleStackIcon width={24} height={24}  className='pr-2' />
              Create Batch Income
            </Link>
        </div>

      </div>
      <Table 
        incomeList={data} 
        incomeTypes={incomeTypes}
        incomeMethods={incomeMethods}
      />
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </main>
  )
}

export default IncomeList;