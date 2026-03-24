'use client';

import { formatCurrency } from '@/app/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

import DeleteReceiptButton from './delete-receipt-button';
import useReceiptBulkActions from '@/app/ui/receipt/bulk-select-delete';

type Row = {
  id: string;
  issueDateISO: string;
  taxYear: number;
  serialNumber: number;
  donorName: string;
  totalCents: number;
  pdfUrl: string | null;
};

const ManageReceiptTable = (props: { rows: Row[]; allowDelete: boolean }) => {
  const { rows, allowDelete } = props;

  const {
    selected,
    pending,
    selectedCount,
    allSelected,
    someSelected,
    toggleAll,
    toggleOne,
    bulkDelete
  } = useReceiptBulkActions(rows);

  return (
    <div className='panel mt-4 overflow-hidden'>
      <div className='flex items-center justify-between border-b bg-muted px-4 py-3'>
        <div className='text-sm text-foreground'>
          {allowDelete ? (
            selectedCount > 0 ? (
              <>
                Selected <span className='font-medium'>{selectedCount}</span>
              </>
            ) : (
              <span className='text-muted-foreground'>Select receipts to bulk delete</span>
            )
          ) : (
            <span className='text-muted-foreground'>Read-only receipt access</span>
          )}
        </div>

        {allowDelete ? (
          <Button
            variant='destructive'
            size='sm'
            onClick={bulkDelete}
            disabled={pending || selectedCount === 0}
          >
            {pending ? 'Deleting...' : 'Bulk delete'}
          </Button>
        ) : (
          <span className='text-sm text-muted-foreground'>Read-only</span>
        )}
      </div>

      <div className='grid grid-cols-12 gap-2 border-b bg-muted px-4 py-3 text-sm font-medium text-muted-foreground'>
        <div className='col-span-1'>
          <Checkbox 
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={allowDelete ? toggleAll : undefined}
            disabled={!allowDelete}
            className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
          />
        </div>
        <div className='col-span-2'>Issued</div>
        <div className='col-span-2'>Serial</div>
        <div className='col-span-3'>Donor</div>
        <div className='col-span-2 text-right'>Amount</div>
        <div className='col-span-1 text-right'>PDF</div>
        <div className='col-span-1 text-right'>Del</div>
      </div>

      {rows.map((r) => {
        const checked = selected.has(r.id);

        return (
          <div 
            key={r.id}
            className='grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0'
          >
            <div className='col-span-1' onClick={(e) => e.stopPropagation()}>
              <Checkbox 
                checked={checked}
                onCheckedChange={allowDelete ? () => toggleOne(r.id) : undefined}
                disabled={!allowDelete}
                className='data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white'
              />
            </div>

            <div className='col-span-2'>{r.issueDateISO}</div>
            <div className='col-span-2'>
              {r.taxYear}-{String(r.serialNumber).padStart(5, '0')}
            </div>
            <div className='col-span-3 truncate'>{r.donorName}</div>
            <div className='col-span-2 text-right font-medium'>{formatCurrency(r.totalCents)}</div>

            <div className='col-span-1 text-right'>
              {r.pdfUrl ? (
                <a
                  href={r.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Open PDF
                </a>
              ) : (
                <span className="text-muted-foreground">Not generated</span>
              )}
            </div>

            <div className='col-span-1 text-right'>
              {allowDelete ? <DeleteReceiptButton receiptId={r.id} /> : null}
            </div>
          </div>
        )
      })}
    </div>
  );
}

export default ManageReceiptTable;
