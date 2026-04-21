'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type QueryValue = string | number | null | undefined;

type UpdateQueryOptions = {
  set?: Record<string, QueryValue>;
  clear?: string[];
  resetPageToOne?: boolean;
  mode?: 'replace' | 'push';
};

const isEmpty = (value: QueryValue) => 
  value == null || (typeof value === 'string' && value.trim() === '');

export const useIncomeQueryParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commit = (nextParams: URLSearchParams, mode: 'replace' | 'push') => {
    const qs = nextParams.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;

    if (mode === 'push') {
      router.push(href);
      return;
    }

    router.replace(href);
  };

  const updateQuery = ({
    set = {},
    clear = [],
    resetPageToOne = true,
    mode = 'replace',
  }: UpdateQueryOptions) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const key of clear) {
      nextParams.delete(key);
    }

    for (const [key, value] of Object.entries(set)) {
      if (isEmpty(value)) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    }

    if (resetPageToOne) {
      nextParams.set('page', '1');      
    } else {
      nextParams.delete('page');
    }

    commit(nextParams, mode);
  };

  return {
    searchParams,
    updateQuery,
  };
};

type UpdateOptions = {
  year?: number;
  resetPage?: boolean;
  clear?: string[];
  set?: Record<string, string | number | null | undefined>;
};

export const useIncomeQuereyParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = ({ year, resetPage = true, clear = [], set = {} }: UpdateOptions) => {
    const params = new URLSearchParams(searchParams.toString());

    if (year != null) params.set('year', String(year));
    for (const key of clear) params.delete(key);

    for (const [key, value] of Object.entries(set)) {
      if (value == null || value === '' || value === 0) params.delete(key);
      else params.set(key, String(value));
    }

    if (resetPage) params.set('page', '1');

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return { searchParams, update };
}