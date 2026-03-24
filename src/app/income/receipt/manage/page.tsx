import Link from 'next/link';
import { toInt } from '@/app/lib/utils';

import YearSelect from '@/app/ui/income/year-select';
import SearchBox from '@/app/ui/income/search-box';
import Pagination from '@/app/ui/income/pagination';

import { fetchReceipts } from '@/app/lib/receipt-manage-data';
import ManageReceiptsTable from '@/app/ui/receipt/manage-receipts-table';
import { canAccessFinance, requireFinanceAccess } from '@/app/lib/auth';


//Bulk Generation of Receipts 
import GenerateYearReceiptsButton from '@/app/ui/receipt/generate-year-receipts-button';
import PageIntro from '@/app/ui/page-intro';
import { buttonVariants } from '@/components/ui/button';

const ManageReceiptsPage = async (props: {
  searchParams?: Promise<{ query?: string; page?: string; year?: string }>;
}) => {
  await requireFinanceAccess({ nextPath: '/income/receipt/manage' });

  const searchParams = await props.searchParams;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const selectedYear = toInt(searchParams?.year) ?? currentYear - 1;
  const query = (searchParams?.query ?? '').trim();
  const currentPage = Number(searchParams?.page) || 1;

  const [{ data, pagination }, canManageFinance] = await Promise.all([
    fetchReceipts({
      query,
      page: currentPage,
      taxYear: selectedYear,
    }),
    canAccessFinance(),
  ]);

  return (
    <main className="space-y-6">
      <PageIntro
        title="Manage Receipts"
        description="Search generated receipts, bulk delete when needed, and keep yearly receipt output organized."
        actions={
          <Link href='/income/receipt' className={buttonVariants({ variant: 'outline' })}>
            Back
          </Link>
        }
      />

      <div className='toolbar-panel flex flex-col gap-4'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
          <div className='flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center'>
            <YearSelect selectedYear={selectedYear} years={years} />
            <div className='w-full xl:min-w-[340px]'>
              <SearchBox selectedYear={selectedYear} initialQuery={query}/>
            </div>
          </div>

          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end'>
            {canManageFinance ? <GenerateYearReceiptsButton taxYear={selectedYear} /> : null}
          </div>
        </div>
      </div>

      <ManageReceiptsTable rows={data} allowDelete={canManageFinance} />

    {pagination.totalPages > 1 && (
      <div className='mt-5 flex w-full justify-center'>
        <Pagination totalPages={pagination.totalPages} />
      </div>
    )}
    </main>
  );
};

export default ManageReceiptsPage;
