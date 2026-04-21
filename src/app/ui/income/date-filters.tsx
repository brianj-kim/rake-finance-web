'use client';

import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useIncomeQueryParams } from '@/app/ui/income/use-income-query-param';

type Props = {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  years: number[];
};

const MONTHS: Array<{ value:number; label: string }> = [
  { value: 0, label: 'All months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const DateFilters = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  years,
}: Props) => {
  const { updateQuery } = useIncomeQueryParams();

  const maxDay = React.useMemo(() => {
    if (!selectedMonth) return 31;
    return daysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const onYearChange = (value: string) => {
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

  const onMonthChange = (value: string) => {
    const month = Number(value);

    if (!Number.isFinite(month) || month < 0 || month > 12) {
      return;
    }

    if (month === 0) {
      updateQuery({
        set: { year: selectedYear },
        clear: ['month', 'day'],
        resetPageToOne: true,
        mode: 'replace',
      });
      return;
    }

    const nextMaxDay = daysInMonth(selectedYear, month);
    const keepDay = selectedDay > 0 && selectedDay <= nextMaxDay ? selectedDay : null;

    updateQuery({
      set: {
        year: selectedYear,
        month,
        day: keepDay
      },
      clear: keepDay == null ? ['day'] : [],
      mode: 'replace',
    });
  };

  const onDayChange = (value: string) => {
    const day = Number(value);

    if (!Number.isFinite(day) || day < 0 || day > 31) {
      return;
    }

    if (!selectedMonth) {
      updateQuery({
        set: { year: selectedYear },
        clear: ['day'],
        resetPageToOne: true,
        mode: 'replace',
      });

      return;
    };

    const nextMaxDay = daysInMonth(selectedYear, selectedMonth);

    if (day === 0 || day > nextMaxDay) {
      updateQuery({
        set: {
          year: selectedYear,
          month: selectedMonth,
        },
        clear: ['day'],
        resetPageToOne: true,
        mode: 'replace',
      });
      return;
    }

    updateQuery({
      set: {
        year: selectedYear,
        month: selectedMonth,
        day,
      },
      resetPageToOne: true,
      mode: 'replace',
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Select value={String(selectedYear)} onValueChange={onYearChange}>
        <SelectTrigger className="w-full sm:w-[130px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(selectedMonth)} onValueChange={onMonthChange}>
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={String(month.value)}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(selectedMonth === 0 ? 0 : selectedDay)}
        onValueChange={onDayChange}
        disabled={selectedMonth === 0}
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">All days</SelectItem>
          {Array.from({ length: maxDay }, (_, index) => index + 1).map((day) => (
            <SelectItem key={day} value={String(day)}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DateFilters;