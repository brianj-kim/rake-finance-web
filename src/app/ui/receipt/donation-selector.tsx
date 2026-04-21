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

type Props = {
  memberId: number;
  taxYear: number;
  donations: DonationRow[];
  canGenerateReceipt: boolean;
};

type SelectionState = {
  selectedIds: Set<number>;
};

type SelectionAction =
  | { type: 'reset'; donationIds: number[] }
  | { type: 'toggle-one'; incId: number }
  | { type: 'toggle-all'; donationIds: number[] };

const createSelectionState = (donationIds: number[]): SelectionState => ({
  selectedIds: new Set(donationIds),
});

const selectionReducer = (
  state: SelectionState,
  action: SelectionAction
): SelectionState => {
  switch (action.type) {
    case 'reset':
      return createSelectionState(action.donationIds);

    case 'toggle-one': {
      const next = new Set(state.selectedIds);

      if (next.has(action.incId)) {
        next.delete(action.incId);
      } else {
        next.add(action.incId);
      }

      return { selectedIds: next };
    }

    case 'toggle-all': {
      if (state.selectedIds.size === action.donationIds.length) {
        return { selectedIds: new Set<number>() };
      }

      return { selectedIds: new Set(action.donationIds) };
    }

    default:
      return state;
  }
};

const DonationSelector = ({
  memberId,
  taxYear,
  donations,
  canGenerateReceipt,
}: Props) => {
  const donationIds = React.useMemo(
    () => donations.map((donation) => donation.incId),
    [donations]
  );

  const dataKey = React.useMemo(
    () => `${memberId}:${taxYear}:${donationIds.join(',')}`,
    [memberId, taxYear, donationIds]
  );

  const [state, dispatch] = React.useReducer(
    selectionReducer,
    donationIds,
    createSelectionState
  );

  const previousDataKeyRef = React.useRef(dataKey);

  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (previousDataKeyRef.current === dataKey) {
      return;
    }

    previousDataKeyRef.current = dataKey;
    dispatch({ type: 'reset', donationIds });
  }, [dataKey, donationIds]);

  const selectedCount = state.selectedIds.size;
  const allSelected = donations.length > 0 && selectedCount === donations.length;

  const totalSelectedCents = React.useMemo(() => {
    let total = 0;

    for (const donation of donations) {
      if (state.selectedIds.has(donation.incId)) {
        total += donation.amountCents;
      }
    }

    return total;
  }, [donations, state.selectedIds]);

  const handleToggleAll = () => {
    if (pending) return;
    dispatch({ type: 'toggle-all', donationIds });
  };

  const handleToggleOne = (incId: number) => {
    if (pending) return;
    dispatch({ type: 'toggle-one', incId });
  };

  const onGenerate = () => {
    if (!canGenerateReceipt) {
      toast.error('You do not have permission to generate receipts.');
      return;
    }

    const incomeIds = Array.from(state.selectedIds.values());

    if (incomeIds.length === 0) {
      toast.error('Select at least one donation.');
      return;
    }

    startTransition(async () => {
      const result = await generateReceiptForSelected({
        memberId,
        taxYear,
        incomeIds,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(`Receipt generated (#${result.serialNumber}). You can review it from the receipts list.`);
    });
  };

  if (donations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No donations found for this year.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="px-3 py-2">
            Selected <span className="text-sm font-semibold">{selectedCount}/{donations.length}</span>
          </Badge>
          <Badge variant="secondary" className="px-3 py-2">
            Total <span className="text-sm font-semibold">{formatCurrency(totalSelectedCents)}</span>
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleToggleAll} disabled={pending}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>

          {canGenerateReceipt ? (
            <Button type="button" onClick={onGenerate} disabled={pending}>
              {pending ? 'Generating...' : 'Generate receipt'}
            </Button>
          ) : null}
        </div>
      </div>

      <Separator />

      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-13">Sel</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {donations.map((donation) => {
              const checked = state.selectedIds.has(donation.incId);

              return (
                <TableRow
                  key={donation.incId}
                  className={pending ? 'opacity-70' : 'cursor-pointer'}
                  onClick={pending ? undefined : () => handleToggleOne(donation.incId)}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleToggleOne(donation.incId)}
                      disabled={pending}
                      className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                    />
                  </TableCell>
                  <TableCell>{donation.dateISO}</TableCell>
                  <TableCell className="text-muted-foreground">{donation.typeName ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{donation.methodName ?? '-'}</TableCell>
                  <TableCell className="max-w-[320px] truncate text-muted-foreground">
                    {donation.notes ?? ''}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(donation.amountCents)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DonationSelector;