'use client';

import * as React from 'react';
import { toast } from 'sonner';

import type { DonationRow } from '@/app/lib/definitions';
import { generateReceiptForSelected } from '@/app/lib/receipt-actions';
import { formatCurrency } from '@/app/lib/utils';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DonationSelector = (props: {
  memberId: number;
  taxYear: number;
  donations: DonationRow[];
}) => {
  const { memberId, taxYear, donations } = props;

  const [selected, setSelected] = React.useState<Set<number>>(
    () => new Set(donations.map((d) => d.incId))
  );

  const [pending, startTransition] = React.useTransition();

  const selectedCount = selected.size;
  const allSelected = donations.length > 0 && selectedCount === donations.length;

  const totalSelectedCents = React.useMemo(() => {
    let total = 0;
    for (const d of donations) if (selected.has(d.incId)) total += d.amountCents;
    return total;
  }, [donations, selected]);

  const onToggleAll = () => {    
    setSelected((prev) => {
      if (prev.size === donations.length) return new Set<number>();
      return new Set(donations.map((d) => d.incId));
    });
  };

  const onToggleOne = (incId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(incId)) next.delete(incId);
      else next.add(incId);

      return next;
    });
  };

  const onGenerate = () => {
    const incomeIds = Array.from(selected.values());
    if (incomeIds.length === 0) {
      toast.error('Select at leat one donations.');
      return;
    }

    startTransition(async () => {
      const res = await generateReceiptForSelected({ memberId, taxYear, incomeIds });
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(`Receipt generated (#${res.serialNumber})`);
      window.open(res.pdfUrl, '_blank', 'noopener, noreferrer');
    });
  };

  if (donations.length === 0) {
    return (
      <div className='text-sm text-muted-foreground'>
        No donations found for this year.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap gap-2 items-center'>
          <Badge variant='secondary' className='px-3 py-2'>
            Selected <span className='font-semibold text-sm'>{selectedCount}/{donations.length}</span>
          </Badge>
          <Badge variant='secondary' className='px-3 py-2'>
            Total <span className='font-semibold text-sm'>{formatCurrency(totalSelectedCents)} </span>
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onToggleAll}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
          <Button type="button" onClick={onGenerate} disabled={pending} className='bg-blue-600 border-blue-600'>
            {pending ? 'Generating…' : 'Generate receipt'}
          </Button>
        </div>
      </div>

      <Separator />

      <div className='rounded-md border overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[52px]'>Sel</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {donations.map((d) => {
              const checked = selected.has(d.incId);
              return (
                <TableRow 
                  key={d.incId}
                  className='cursor-pointer'
                  onClick={() => onToggleOne(d.incId)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} >
                    <Checkbox 
                      checked={checked} 
                      onCheckedChange={() => onToggleOne(d.incId)} 
                      className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white'
                    />
                  </TableCell>
                  <TableCell>{d.dateISO}</TableCell>
                  <TableCell className='text-muted-foreground'>{d.typeName ?? '-'}</TableCell>
                  <TableCell className='text-muted-foreground'>{d.methodName ?? '-'}</TableCell>
                  <TableCell className='max-w-[320px] truncate text-muted-foreground'>
                    {d.notes ?? ''}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatCurrency(d.amountCents)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );

}

export default DonationSelector;