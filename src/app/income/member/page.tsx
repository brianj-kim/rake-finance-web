import { UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchFilteredMembers } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import SearchBox from '@/app/ui/income/search-box';
import { formatEnglishName } from '@/app/lib/utils';
import MemberCardActions from '@/app/ui/income/member-card-actions';
import Pagination from '@/app/ui/income/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formatValue = (v: string | null) => (v?.trim() ? v.trim() : '-');

const MemberList = async (props: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) => {
  const searchParams = await props.searchParams;
  const query = (searchParams?.query ?? '').trim();
  const currentPage = Number(searchParams?.page) || 1;

  const { data: members, pagination } = await fetchFilteredMembers(query, currentPage);  

  const currentYear = new Date().getFullYear();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Member Admin</h1>

      <div className="w-full flex flex-col gap-3 md:flex-row md:items-end">
        <div className="w-full md:flex-1">
          <SearchBox
            selectedYear={currentYear}
            initialQuery={query}
            clearKeys={["query", "page"]}
            placeholder="Search member..."
          />
        </div>

        <div className="flex w-full justify-center sm:justify-start md:w-auto md:justify-end">
          <Link
            href="/income/member/create"
            className="inline-flex shrink-0 flex-1 items-center gap-2 whitespace-nowrap md:flex-none rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <UserPlusIcon className="h-5 w-5" />
            New Member
          </Link>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m: any) => (

        <div
          key={m.mbr_id}              
          className='w-full overflow-hidden rounded-md border border-gray-200 hover:bg-gray-100 transition-colors'
        >
          {/* Header */}
          <div className='w-full flex items-center justify-between gap-3 bg-gray-100 px-4 py-3'>
            {/* Clickable name area */}
            
            <div className="min-w-0">
              <div className="font-semibold truncate">{formatValue(m.name_kFull)}</div>
              <div className="text-sm text-muted-foreground truncate">
                {formatEnglishName(m.name_eFirst, m.name_eLast)}
              </div>
            </div>

            {/* Header actions */}
            <div className='flex shrink-0 gap-2'>
              <MemberCardActions memberId={m.mbr_id} />
            </div>
          </div>              

          {/* Content */}
          <div className="px-4 py-3 space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-sm truncate">{formatValue(m.email)}</div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">City</div>
                <div className="text-sm truncate">{formatValue(m.city)}</div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm text-muted-foreground">Postal</div>
                <div className="text-sm">{formatValue(m.postal)}</div>
              </div>
            </div>
          </div>

        </div>
          
        ))}
      </div>

      {members.length === 0 && (
        <div className="mt-4 rounded-md border p-4 text-sm text-muted-foreground">
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