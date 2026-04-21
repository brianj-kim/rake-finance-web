import { UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchFilteredMembers } from '@/app/lib/data';
import PageIntro from '@/app/ui/page-intro';
import SearchBox from '@/app/ui/income/search-box';
import { formatEnglishName } from '@/app/lib/utils';
import MemberCardActions from '@/app/ui/income/member-card-actions';
import Pagination from '@/app/ui/income/pagination';
import { canAccessFinance, requireFinanceAccess } from '@/app/lib/auth';
import { buttonVariants } from '@/components/ui/button';

type MemberRow = Awaited<ReturnType<typeof fetchFilteredMembers>>['data'][number];

const formatValue = (v: string | null) => (v?.trim() ? v.trim() : '-');

const MemberList = async (props: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) => {
  await requireFinanceAccess({ nextPath: '/income/member' });

  const searchParams = await props.searchParams;
  const query = (searchParams?.query ?? '').trim();
  const currentPage = Number(searchParams?.page) || 1;

  const [{ data: members, pagination }, canManageFinance] = await Promise.all([
    fetchFilteredMembers(query, currentPage),
    canAccessFinance(),
  ]);

  // const currentYear = new Date().getFullYear();

  return (
    <main className="space-y-6">
      <PageIntro
        title="Member Admin"
        description="Search and maintain donor profiles, contact details, and receipt-related tax information."
        actions={
          <Link href="/income/member/create" className={buttonVariants({ variant: "default" })}>
            <UserPlusIcon className="h-5 w-5" />
            New Member
          </Link>
        }
      />

      <div className="toolbar-panel flex flex-col gap-4">
        <div className="w-full md:flex-1">
          <SearchBox
            initialQuery={query}
            clearKeys={["query", "page"]}
            placeholder="Search member..."
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {query ? (
          <>
            Showing results for:{" "}
            <span className="font-medium text-foreground">{query}</span>
            <span className="ml-2">({members.length})</span>
          </>
        ) : (
          <>
            Total members:{" "}
            <span className="font-medium text-foreground">{members.length}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m: MemberRow) => (

        <div
          key={m.mbr_id}              
          className='panel-muted w-full overflow-hidden'
        >
          {/* Header */}
          <div className='w-full flex items-center justify-between gap-3 border-b bg-background px-5 py-4'>
            {/* Clickable name area */}
            
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-foreground">{formatValue(m.name_kFull)}</div>
              <div className="text-sm text-muted-foreground truncate">
                {formatEnglishName(m.name_eFirst, m.name_eLast)}
              </div>
            </div>

            {/* Header actions */}
            <div className='flex shrink-0 gap-2'>
              <MemberCardActions memberId={m.mbr_id} canUpdate={canManageFinance} />
            </div>
          </div>              

          {/* Content */}
          <div className="space-y-3 px-5 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</div>
              <div className="mt-1 truncate text-sm text-foreground">{formatValue(m.email)}</div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">City</div>
                <div className="mt-1 truncate text-sm text-foreground">{formatValue(m.city)}</div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Postal</div>
                <div className="mt-1 text-sm text-foreground">{formatValue(m.postal)}</div>
              </div>
            </div>
          </div>

        </div>
          
        ))}
      </div>

      {members.length === 0 && (
        <div className="empty-state">
          No members found.
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={pagination.totalPages} />
        </div>
      )}  

      
      {/* <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Member Admin</h1>
        <SearchBox 
          selectedYear={currentYear}
          initialQuery={query} 
        />
        <Link
          href="/income/member/create"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlusIcon className="h-5 w-5" />
          New Member
        </Link>        
      </div>

      {query ? (
        <div className='text-sm text-muted-foreground'>
          Showing results for: <span className='font-medium text-foreground'>{query}</span>
          <span className='ml-2'>({members.length})</span>
        </div>
      ) : (
        <div className='text-sm text-muted-foreground'>
          Total members: <span className='font-medium text-foreground'>{members.length}</span>
        </div>
      )}

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {members.map((m: any) => (
          <Card key={m.mbr_id} className='shadow-sm'>
            <CardHeader className='pb-2'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <CardTitle className='text-base'>{formatValue(m.name_kFull)}</CardTitle>
                  <div className='text-sm text-muted-foreground'>
                    {formatEnglishName(m.name_eFirst, m.name_eLast)}
                  </div>
                </div>
                <MemberCardActions memberId={m.mbr_id} />
              </div>              
            </CardHeader>

            <CardContent className='space-y-2 text-sm'>
              <div>
                <div className='text-muted-foreground'>Email</div>
                <div className='truncate'>{formatValue(m.email)}</div>
              </div>

              <div className='flex gap-6'>
                <div className='min-w-0'>
                  <div className='text-muted-foreground'>City</div>
                  <div className='truncate'>{formatValue(m.city)}</div>
                </div>

                <div className='shrink-0'>
                  <div className='text-muted-foreground'>Postal</div>
                  <div>{formatValue(m.postal)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <div className='rounded-md border p-4 text-sm text-muted-foreground'>
          No members found.
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className='mt-5 flex w-full justify-center'>
          <Pagination totalPages={pagination.totalPages} />
        </div>
      )} */}
    </main>
  );
}

export default MemberList;
