'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIncomeQueryParams } from './use-income-query-param';

type Props = {
  selectedYear: number;
  years: number[];
};

const YearSelect = ({ selectedYear, years }: Props) => {
  const { updateQuery } = useIncomeQueryParams();

  const onChange = (value: string) => {
    const year = Number(value);

    if (!Number.isFinite(year) || year === selectedYear) {
      return;
    }

    updateQuery({
      set: { year },
      clear: ['month', 'day'],
      resetPageToOne: true,
      mode: 'replace',
    });
  };

  return (
    <Select value={String(selectedYear)} onValueChange={onChange}>
      <SelectTrigger className='w-[35]'>
        <SelectValue placeholder='Year' />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default YearSelect;