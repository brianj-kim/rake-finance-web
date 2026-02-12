import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import { toInt } from '@/app/lib/utils';

import { getReceiptMemberMenu } from '@/app/lib/receipt-data';
import Pagination from '@/app/ui/income/pagination';
import YearSelect from '@/app/ui/income/year-select';
import SearchBox from '@/app/ui/income/search-box';
import ReceiptMemberGrid from '@/app/ui/receipt/receipt-member-grid';


const ReceiptMainPage = async (props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    year?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const selectedYear = toInt(searchParams?.year) ?? currentYear - 1;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const { items, totalPages } = await getReceiptMemberMenu({
    taxYear: selectedYear,
    page: currentPage,
    query,
  });

  return (
    <main>
      <h1 className={`${lusitana.className} text-xl md:text-2xl`}>
        Donation Reciept
      </h1>
      <p className="text-sm text-muted-foreground mb-4 ">
        Select a member to review donations and generate a receipt.
      </p>

      <div className='w-full flex flex-col gap-3 md:flex-row md:items-end'>
        
        <div className='w-full flex flex-col gap-3 items-center sm:flex-row sm:flex-wrap sm:items-end sm:justify-start md:flex-1'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground whitespace-nowrap'>Tax Year:</span>
            <YearSelect selectedYear={selectedYear} years={years} />
          </div>

          <div className='w-full sm:flex-1'>
            <SearchBox 
              selectedYear={selectedYear}
              initialQuery={query}
              clearKeys={['query', 'page']}
              placeholder='Search member name'
            />
          </div>
        </div>

        <div className='flex w-full justify-center sm:justify-start md:w-auto md:justify-end'>
          <Link 
            href='/income/receipt/manage' 
            className='flex flex-1 shrink-0 items-center gap-2 whitespace-nowrap md:flex-none rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white'
          >
            Manage Receipts
          </Link>
        </div>
      </div>
      <ReceiptMemberGrid members={items} taxYear={selectedYear} />

      <div className='mt-5 flex w-full justify-center'>
        <Pagination totalPages={totalPages} />
      </div>
    </main>
  )
}

export default ReceiptMainPage;