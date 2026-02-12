import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import { toInt, formatCurrency } from '@/app/lib/utils';

import YearSelect from '@/app/ui/income/year-select';
import SearchBox from '@/app/ui/income/search-box';
import Pagination from '@/app/ui/income/pagination';

import { fetchReceipts } from '@/app/lib/receipt-manage-data';
import ManageReceiptsTable from '@/app/ui/receipt/manage-receipts-table';


//Bulk Generation of Receipts 
import GenerateYearReceiptsButton from '@/app/ui/receipt/generate-year-receipts-button';

const ManageReceiptsPage = async (props: {
  searchParams?: Promise<{ query?: string; page?: string; year?: string }>;
}) => {
  const searchParams = await props.searchParams;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const selectedYear = toInt(searchParams?.year) ?? currentYear - 1;
  const query = (searchParams?.query ?? '').trim();
  const currentPage = Number(searchParams?.page) || 1;

  const { data, pagination } = await fetchReceipts({
    query,
    page: currentPage,
    taxYear: selectedYear,
  });

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Manage Receipts</h1>

      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2'>
          <YearSelect selectedYear={selectedYear} years={years} />
          <div className='w-full sm:w-auto'>
            <SearchBox selectedYear={selectedYear} initialQuery={query}/>
          </div>
        </div>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end'>
          <GenerateYearReceiptsButton taxYear={selectedYear} />
          <Link
            href='/income/receipt'
            className='inline-flex items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50'
          >
            Back
          </Link>
        </div>
      </div>

      <ManageReceiptsTable rows={data} />

    {pagination.totalPages > 1 && (
      <div className='mt-5 flex w-full justify-center'>
        <Pagination totalPages={pagination.totalPages} />
      </div>
    )}
    </main>
  );
};

export default ManageReceiptsPage;