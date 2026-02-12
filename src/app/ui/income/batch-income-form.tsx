"use client";

import React, { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import  { ArrowDownCircleIcon, ArrowsUpDownIcon, ArrowUturnRightIcon, ReceiptRefundIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

import { lusitana } from "../fonts";

import BatchTotalSummary from "./entries-stat";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BatchFormValues, BatchSchema, CategoryDTO } from "../../lib/definitions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveBatchIncome } from "@/app/lib/actions";

import Link from 'next/link';

const DEFAULT_ROW: BatchFormValues["entries"][number] = {
  name: "",
  amount: 0,
  typeId: 0,
  methodId: 0,
  note: ""
};

const makeDefaultEntries = (count: number): BatchFormValues["entries"] => 
  Array.from({ length: count }, () => ({ ...DEFAULT_ROW }));

type EntryRowProps = {
  index: number;
  control: Control<BatchFormValues>;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  disableRemove: boolean;
  onRemove: () => void;
}

const EntryRow = React.memo(function EntryRow({
  index,
  control,
  incomeTypes,
  incomeMethods,
  disableRemove,
  onRemove
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
                <Input {...field} placeholder="Name" />
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
                  type="number"
                  inputMode="numeric"
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  placeholder="0"
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
                value={field.value > 0 ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent >
                  {incomeTypes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.detail ? `${c.name}(${c.detail})` : c.name}
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
                value={field.value > 0 ? String(field.value) : ""}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Method" />                    
                  </SelectTrigger>                  
                </FormControl>
                <SelectContent>
                  {incomeMethods.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.detail ? `${c.name}(${c.detail})` : c.name}
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
                <Textarea {...field} className='min-h-10' placeholder="Optional" />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell className="text-right">
        <Button type="button" variant="secondary" onClick={onRemove} disabled={disableRemove}>
          Remove
        </Button>
      </TableCell>
    </TableRow>
  )
});

// Main form begins
type Props = {
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  defaultRowCount?: number;
}

const BatchIncomeForm = ({ incomeTypes, incomeMethods, defaultRowCount = 20 }: Props) =>{
  const router = useRouter();

  const today = useMemo(() => new Date(), []);

  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [rowsToAdd, setRowsToAdd] = useState<number>(1);

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(BatchSchema),
    defaultValues: {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
      entries: makeDefaultEntries(defaultRowCount)
    },
    mode: "onSubmit"
  });

  const { control, setValue, formState } = form;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "entries"
  });

  const [year, month, day] = useWatch({
    control,
    name: ["year", "month", "day"]
  });

  const dateLabel = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setValue("year", date.getFullYear());
    setValue("month", date.getMonth() + 1);
    setValue("day", date.getDate());
  }

  const onSubmit = async (values: BatchFormValues) => {
    const result = await saveBatchIncome(values);    

    if (!result.success) {
      // alert(result.message ?? "Failed to save.");
      toast.error(result.message ?? "Failed to save.");
      return;
    }

    // Reset rows only (keep same data)
    replace(makeDefaultEntries(defaultRowCount));

    const createdMembers = (result as any).createdMembers ?? 0;
    const incomeCount = (result as any).incomeCount ?? 0;

    const msg = 
      createdMembers > 0
      ? `Saved ${incomeCount} entries. Added ${createdMembers} new member(s).`
      : `Saved ${incomeCount} entries.`;

      alert(msg);
      router.push(`/income/list?year=${year}`);
  };

  return (
    <Form {...form}>
      <h1 className={`${lusitana.className} mb-6 text-xl md:text-2xl`}>Create Income on {dateLabel}</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">      
        {/* Shared date */}
        <div className='sticky top-0 z-40 border-b bg-white/90 backdrop-blur-sm py-2'>       
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
            <Link href={`/income/list?year=${year}`} className='flex items-center gap-2'>
              <ArrowLeftIcon className='h-5 w-5' />
              Back to list
            </Link>
          </Button>

          <Button
              type='button'
              onClick={() => replace(makeDefaultEntries(1))}
              disabled={formState.isSubmitting || fields.length === 1}
              className='inline-flex shrink-0 items-center gap-2 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-700/60'
            >
              <ReceiptRefundIcon className='h-5 w-5' /> Clear to single row
            </Button>  
        </div>     

        {/* Rows */}
        <div className='w-full overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader className="sticky top-0 bg-gray-100">
              <TableRow className="hover:bg-gray-100">
                <TableHead className="w-5 font-semibold text-gray-700">#</TableHead>
                <TableHead className="w-32 font-semibold text-gray-700">Name</TableHead>
                <TableHead className="w-36 font-semibold text-gray-700">Amount (in cents)</TableHead>
                <TableHead className="w-54 font-semibold text-gray-700">Type</TableHead>
                <TableHead className="w-52 font-semibold text-gray-700">Method</TableHead>
                <TableHead className="w-min-100 font-semibold text-gray-700">Note</TableHead>
                <TableHead className="w-25 font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.map((f, idx) => (
                <EntryRow
                  key={f.id}
                  index={idx}
                  control={control}
                  incomeTypes={incomeTypes}
                  incomeMethods={incomeMethods}
                  disableRemove={fields.length <= 1 || formState.isSubmitting}
                  onRemove={() => remove(idx)}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className='flex flex-wrap items-center gap-2'>
            {/* <Input
              type="number"
              min="1"
              max="100"
              value={rowsToAdd}
              onChange={(e) => setRowsToAdd(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-20"
              disabled={formState.isSubmitting}
            /> */}

            <Input
              type="number"
              min="1"
              max="100"
              value={rowsToAdd}
              onChange={(e) => setRowsToAdd(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => {
                const val = Number(e.target.value);
                if (!val || val < 1) setRowsToAdd(1);
                else if (val > 100) setRowsToAdd(100);
                else setRowsToAdd(val);
                
              }}
              className="w-20"
              disabled={formState.isSubmitting}
            />

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                for (let i = 0; i < rowsToAdd; i++) {
                  append({...DEFAULT_ROW});
                }
              }}
              disabled={formState.isSubmitting}
              className='inline-flex items-center gap-2 whitespace-nowrap'
            >
              <ArrowsUpDownIcon className='h-5 w-5' /> Add {rowsToAdd} row{rowsToAdd !== 1 ? 's' : ''}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => replace(makeDefaultEntries(defaultRowCount))}
              disabled={formState.isSubmitting}
              className="inline-flex items-center gap-2 whitespace-nowrap"
            >
              <ArrowUturnRightIcon className='h-5 w-5' />
              Reset to {defaultRowCount} rows
            </Button>
          </div>

          <Button 
            type="submit" 
            disabled={formState.isSubmitting}
            className='inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700'             
          >
            <ArrowDownCircleIcon />
            {formState.isSubmitting ? "Saving..." : "Save Entries"}
          </Button>
        </div>

      </form>
    </Form>
  );
}

export default BatchIncomeForm;