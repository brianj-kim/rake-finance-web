'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  selectedYear: number;
  initialQuery: string;

  clearKeys?: string[];
  resetPageToOne?: boolean;
  placeholder?: string;
};

const SearchBox = ({
  selectedYear,
  initialQuery = '',
  clearKeys = ['query', 'page'],
  resetPageToOne = true,
  placeholder = 'Search...'
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = React.useState<string>(initialQuery);

  React.useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const applySearch = (nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('year', String(selectedYear));
    params.delete('page');
    
    const q = nextQuery.trim();
    if (q) params.set('query', q);
    else params.delete('query');

    if (resetPageToOne) params.set('page', '1');
    else params.delete('page');

    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearAllToSelectedYear = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('year', String(selectedYear));
    for (const k of clearKeys) params.delete(k);

    if (resetPageToOne) params.set('page', '1');

    setValue('');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasAnythingToClear = 
    searchParams.has('query') ||
    (clearKeys.some((k) => searchParams.has(k)) || false) ||
    (resetPageToOne ? searchParams.get('page') !== '1' : searchParams.has('page'));

  return (
    <form
      className='flex w-full flex-col gap-2 sm:flex-row sm:items-center'
      onSubmit={(e) => {
        e.preventDefault();
        applySearch(value);
      }}
    >
      <Input 
        className='min-w-0 flex-1 sm:min-w-[280px]'
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type='submit' variant='outline' className='sm:self-stretch'>
        Search
      </Button>

      <Button 
        type='button'
        variant='secondary'
        className='sm:self-stretch'
        onClick={clearAllToSelectedYear}
        disabled={!hasAnythingToClear}
      >
        Clear
      </Button>
    </form>
  )
}

export default SearchBox;
