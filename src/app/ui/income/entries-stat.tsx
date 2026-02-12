'use client';

import { useMemo, useState } from "react";
import { Control, useWatch } from "react-hook-form";

import { cn } from "@/lib/utils";
import CalendarIcon from "@heroicons/react/24/outline/CalendarIcon";
import { BatchFormValues, CategoryDTO } from "../../lib/definitions";
import { formatCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from '@/components/ui/badge';

type Props = {
  control: Control<BatchFormValues>;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

// Showing Statiscis - grand total, group by type, and group by method
const BatchTotalSummary = ({ control, incomeTypes, incomeMethods, selectedDate, onDateChange }: Props) => {
  const [open, setOpen] = useState<boolean>(false);
  const entries = useWatch({ control, name: "entries" }) ?? [];

  const typeMap = useMemo(() => new Map(incomeTypes.map(t => [t.id, t])), [incomeTypes]);
  const methodMap = useMemo(() => new Map(incomeMethods.map(m => [m.id, m])), [incomeMethods]);

  const { totalCents, byType, byMethod } = useMemo(() => {
    const typeSum = new Map<number, number>();
    const methodSum = new Map<number, number>();
    let total = 0;

    for (const e of entries) {
      const cents = Number(e?.amount ?? 0);
      if (!Number.isFinite(cents) || cents <= 0) continue;

      total += cents;

      if (e.typeId > 0) typeSum.set(e.typeId, (typeSum.get(e.typeId) ?? 0) + cents);
      if (e.methodId > 0) methodSum.set(e.methodId, (methodSum.get(e.methodId) ?? 0) + cents);
    }

    const typeRows = Array.from(typeSum.entries())
      .map(([id, cents]) => ({ id, name: typeMap.get(id)?.name ?? `Type ${id}`, cents }))
      .sort((a, b) => b.cents - a.cents);

    const methodRows = Array.from(methodSum.entries())
      .map(([id, cents]) => ({ id, name: methodMap.get(id)?.name ?? `Method ${id}`, cents }))
      .sort((a, b) => b.cents - a.cents);

    return { totalCents: total, byType: typeRows, byMethod: methodRows };
  }, [entries, typeMap, methodMap]);

   return (    
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Date</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date);
                    setOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>

        </CardContent>
      </Card>

      {/* Batch Total Card */}
      <Card className='border-blue-200 bg-blue-50'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Batch Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-semibold tabular-nums'>
            {formatCurrency(totalCents)}
          </div>
          <div className='mt-2 text-xs text-gray-600'>{entries.length} row(s)</div>
        </CardContent>
      </Card>

      {/* By Type */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>By Type</CardTitle>
        </CardHeader>
        <CardContent className='space-y-1'>
          {byType.length === 0 ? (
            <div className='text-sm text-gray-500'>No entries</div>
          ) : (
            byType.slice(0, 5).map((r) => (
              <div key={r.id} className='flex items-center justify-between gap-2 text-sm'>
                <span className='truncate text-gray-700'>{r.name}</span>
                <span className='tabular-nums text-gray-900'>{formatCurrency(r.cents)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* By Method */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>By Method</CardTitle>
        </CardHeader>
        <CardContent className='space-y-1'>
          {byMethod.length === 0 ? (
            <div className='text-sm text-gray-500'>No entries</div>
          ) : (
            byMethod.slice(0, 5).map((r) => (
              <div key={r.id} className='flex items-center juistify-between gap-2 text-sm'>
                <span className='truncate text-gray-700'>{r.name}</span>
                <span className='tabular-nums text-gray-900'>{formatCurrency(r.cents)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}



export default BatchTotalSummary;