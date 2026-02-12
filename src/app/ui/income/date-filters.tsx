'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type Props = {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  years: number[];
};

const MONTHS: Array<{ value: number; label: string }> = [
  { value: 0, label: "All months" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();


const DateFilters = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  years,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const maxDay = React.useMemo(() => {
    if (!selectedMonth) return 31;
    return daysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const push = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);

    params.delete('page');

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const onYearChange = (value: string) => {
    const y = Number(value);
    if (!Number.isFinite(y)) return;

    push((params) => {
      params.set('year', String(y));
      params.delete('month');
      params.delete('day');
    });
  };

  const onMonthChange = (value: string) => {
    const m = Number(value);
    if (!Number.isFinite(m) || m < 0 || m > 12) return;

    push((params) => {
      params.set('year', String(selectedYear));

      if (m === 0) {
        params.delete('month');
        params.delete('day');
        return;
      }

      params.set('month', String(m));

      const currentDay = Number(params.get('day') ?? '0');
      const dim = daysInMonth(selectedYear, m);
      if (currentDay > dim) params.delete('day');
    });
  };

  const onDayChange = (value: string) => {
    const d = Number(value);
    if (!Number.isFinite(d) || d < 0 || d > 31) return;

    push((params) => {
      const monthParam = Number(params.get('month') ?? '0');
      if (!monthParam) {
        params.delete('day');
        return;
      }

      const dim = daysInMonth(selectedYear, monthParam);

      if (d === 0) {
        params.delete('day');
        return;
      }

      if (d > dim) {
        params.delete('day');
        return;
      }

      params.set('day', String(d));
    });
  };

  return (
    <div className='flex items-center gap-2'>
      <Select value={String(selectedYear)} onValueChange={onYearChange}>
        <SelectTrigger className='w-25'>
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

      <Select value={String(selectedMonth)} onValueChange={onMonthChange}>
        <SelectTrigger className='w-30'>
          <SelectValue placeholder='Month' />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={String(m.value)}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(selectedMonth === 0 ? 0 : selectedDay)}
        onValueChange={onDayChange}
        disabled={selectedMonth === 0}
      >
        <SelectTrigger className='w-30'>
          <SelectValue placeholder='Day' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='0'>All days</SelectItem>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <SelectItem key={d} value={String(d)}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default DateFilters;