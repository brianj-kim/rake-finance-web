'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const YearSelect = (props: { 
  selectedYear: number;
  years: number[];
}) => {
  const { selectedYear, years } = props;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const y = Number(value);
    const params = new URLSearchParams(searchParams.toString());

    if (Number(value) === selectedYear) return;

    params.set('year', String(y));
    params.delete('month');
    params.delete('day');
    params.set('page', '1');

    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={String(selectedYear)} onValueChange={onChange}>
      <SelectTrigger className='w-[140px]'>
        <SelectValue placeholder='Year' />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default YearSelect;