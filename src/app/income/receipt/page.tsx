import Link from 'next/link';
import { toInt } from '@/app/lib/utils';

import { getReceiptMemberMenu } from '@/app/lib/receipt-data';
import Pagination from '@/app/ui/income/pagination';
import YearSelect from '@/app/ui/income/year-select';
import SearchBox from '@/app/ui/income/search-box';
import ReceiptMemberGrid from '@/app/ui/receipt/receipt-member-grid';
import { requireFinanceAccess } from '@/app/lib/auth';
import PageIntro from '@/app/ui/page-intro';
import { buttonVariants } from '@/components/ui/button';


const ReceiptMainPage = async (props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    year?: string;
  }>;
}) => {
  await requireFinanceAccess({ nextPath: '/income/receipt' });

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
    <main className="space-y-6">
      <PageIntro
        title="Donation Receipt"
        description="Select a member to review donations, confirm the included entries, and open generated PDFs."
        actions={
          <Link href='/income/receipt/manage' className={buttonVariants({ variant: 'default' })}>
            Manage Receipts
          </Link>
        }
      />

      <div className='toolbar-panel flex flex-col gap-4'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
          <div className='flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end'>
            <div className='flex items-center gap-3'>
              <span className='text-sm text-muted-foreground whitespace-nowrap'>Tax Year</span>
              <YearSelect selectedYear={selectedYear} years={years} />
            </div>

            <div className='w-full xl:min-w-[340px] xl:flex-1'>
              <SearchBox 
                selectedYear={selectedYear}
                initialQuery={query}
                clearKeys={['query', 'page']}
                placeholder='Search member name'
              />
            </div>
          </div>
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
