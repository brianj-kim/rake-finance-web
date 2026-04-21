'use client';

import React, { useState } from 'react';
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownCircleIcon,
  ArrowsUpDownIcon,
  ArrowUturnRightIcon,
  ReceiptRefundIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import BatchTotalSummary from '@/app/ui/income/entries-stat';
import { BatchFormValues, BatchSchema, CategoryDTO } from '@/app/lib/definitions';
import { saveBatchIncome } from '@/app/lib/actions';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const DEFAULT_ROW: BatchFormValues['entries'][number] = {
  name: '',
  amount: 0,
  typeId: 0,
  methodId: 0,
  note: '',
};

const makeDefaultEntries = (count: number): BatchFormValues['entries'] => 
  Array.from({ length: count }, () => ({ ...DEFAULT_ROW }));

const clampRowsToAdd = (value: number) => {
  if (!Number.isFinite(value) || value < 1) return 1;
  if (value > 100) return 100;
  return Math.floor(value);
};

const isInteger = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value);

const buildSelectedDate = (
  year: number | undefined,
  month: number | undefined,
  day: number | undefined,
  fallback: Date
) => {
  if (!isInteger(year) || !isInteger(month) || !isInteger(day)) {
    return fallback;
  }

  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) { 
    return fallback;
  }

  return date;
};

type EntryRowProps = {
  index: number;
  control: Control<BatchFormValues>;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  disableRemove: boolean;
  onRemove: () => void;
};

const EntryRow = React.memo(function EntryRow({
  index,
  control,
  incomeTypes,
  incomeMethods,
  disableRemove,
  onRemove,
}: EntryRowProps) {
  return (
    <TableRow>
      <TableCell>{index + 1}</TableCell>

      <TableCell>
        <FormField 
          control={control}
          name={`entries.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} placeholder='Name' />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField 
          control={control}
          name={`entries.${index}.amount`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input 
                  type='number'
                  inputMode='numeric'
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(e) => 
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  placeholder='0'  
                />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField 
          control={control}
          name={`entries.${index}.typeId`}
          render={({ field }) => (
            <FormItem>
              <Select 
                value={field.value > 0 ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select Type' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {incomeTypes.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.detail ? `${category.name} (${category.detail})` : category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField 
          control={control}
          name={`entries.${index}.methodId`}
          render={({ field }) => (
            <FormItem>
              <Select 
                value={field.value > 0 ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select Method' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {incomeMethods.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.detail ? `${category.name} (${category.detail})` : category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField 
          control={control}
          name={`entries.${index}.note`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} className='min-h-10' placeholder='Optional' />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className='text-right'>
        <Button type='button' variant='secondary' onClick={onRemove} disabled={disableRemove}>
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
});

type Props = {
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  defaultRowCount?: number;
};

const BatchIncomeForm = ({
  incomeTypes,
  incomeMethods,
  defaultRowCount = 20,
}: Props) => {
  const router = useRouter();
  const [initialDate] = useState(() => new Date());
  const [rowsToAdd, setRowsToAdd] = useState(1);

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(BatchSchema),
    defaultValues: {
      year: initialDate.getFullYear(),
      month: initialDate.getMonth() + 1,
      day: initialDate.getDate(),
      entries: makeDefaultEntries(defaultRowCount)
    },
    mode: 'onSubmit',
  });

  const { control } = form;
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'entries',
  });

  const [watchedYear, watchedMonth, watchedDay] = useWatch({
    control,
    name: ['year', 'month', 'day'],
  });

  const backYear =
    isInteger(watchedYear) && watchedYear >= 2000
      ? watchedYear
      : initialDate.getFullYear();

  const selectedDate = buildSelectedDate(
    watchedYear,
    watchedMonth,
    watchedDay,
    initialDate
  );

  const safeRowsToAdd = clampRowsToAdd(rowsToAdd);

  const handleDateChange = (date: Date) => {
    form.setValue('year', date.getFullYear(), {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('month', date.getMonth() + 1, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('day', date.getDate(), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await saveBatchIncome(values);

    if (!result.success) {
      toast.error(result.message ?? 'Failed to save.');
      return;
    }

    const message = 
    result.createdMembers > 0
      ? `Saved ${result.incomeCount} entries. Added ${result.createdMembers} new member(s).`
      : `Saved ${result.incomeCount} entries`;

      toast.success(message);

      form.reset({
        year: values.year,
        month: values.month,
        day: values.day,
        entries: makeDefaultEntries(defaultRowCount),
      });

      router.push(`/income/list?year=${values.year}`);
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form} >
      <form onSubmit={onSubmit} className='space-y-4'>
        <div className='sticky top-0 z-20 py-1'>
          <BatchTotalSummary 
            control={control}
            incomeTypes={incomeTypes}
            incomeMethods={incomeMethods}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </div>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <Button asChild variant='secondary'>
            <Link href={`/income/list?year=${backYear}`} className='flex items-center gap-2'>
              <ArrowLeftIcon className='h-5 w-5' />
              Back to list
            </Link>
          </Button>

          <Button 
            type='button'
            onClick={() => replace(makeDefaultEntries(1))}
            disabled={isSubmitting || fields.length === 1}
            className='inline-flex shrink-0 items-center gap-2 whitespace-nowrap'
          >
            <ReceiptRefundIcon className='h-5 w-5' />
            Clear to single row
          </Button>
        </div>

        <div className='panel w-full overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-5'>#</TableHead>
                <TableHead className='w-32'>Name</TableHead>
                <TableHead className='w-36'>Amount (in cents)</TableHead>
                <TableHead className='w-54'>Type</TableHead>
                <TableHead className='w-52'>Method</TableHead>
                <TableHead className='w-min-100'>Note</TableHead>
                <TableHead className='w-25'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <EntryRow 
                  key={field.id}
                  index={index}
                  control={control}
                  incomeTypes={incomeTypes}
                  incomeMethods={incomeMethods}
                  disableRemove={fields.length <= 1 || isSubmitting}
                  onRemove={() => remove(index)}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <Input             
              type='number'
              min='1'
              max='100'
              value={rowsToAdd}
              onChange={(e) => setRowsToAdd(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              onBlur={() => setRowsToAdd(safeRowsToAdd)}
              className='w-20'
              disabled={isSubmitting}
            />

            <Button 
              type='button'
              variant='secondary'
              onClick={() => append(makeDefaultEntries(safeRowsToAdd))}
              disabled={isSubmitting}
              className='inline-flex items-center gap-2 whitespace-nowrap'
            >
              <ArrowsUpDownIcon className='h-5 w-5' />
              Add {safeRowsToAdd} row{safeRowsToAdd !== 1 ? 's' : ''}
            </Button>

            <Button 
              type='button'
              variant='secondary'
              onClick={() => replace(makeDefaultEntries(defaultRowCount))}
              disabled={isSubmitting}
              className='inline-flex items-center gap-2 whitespace-nowrap'
            >
              <ArrowUturnRightIcon className='h-5 w-5' />
              Reset to {defaultRowCount} rows
            </Button>
          </div>

          <Button type='submit' disabled={isSubmitting} className='inline-flex items-center gap-2'>
            <ArrowDownCircleIcon className='h-5 w-5' />
            {isSubmitting ? 'Saving...' : 'Save Entries'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default BatchIncomeForm;