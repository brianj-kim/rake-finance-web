'use client';

import Link from 'next/link';
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

const ManageReceiptTable = (props: { rows: Row[] }) => {
  const { rows } = props;

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
    <div className='mt-4 rounded-md border border-gray-200'>
      <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2'>
        <div className='text-sm text-gray-700'>
          {selectedCount > 0 ? (
            <>
              Selected <span className='font-medium'>{selectedCount}</span>
            </>
          ) : (
            <span className='text-gray-500'>Select receipts to bulk delete</span>
          )}
        </div>

        <Button
          variant='destructive'
          size='sm'
          onClick={bulkDelete}
          disabled={pending || selectedCount === 0}
        >
          {pending ? 'Deleting...' : 'Bulk delete'}
        </Button>
      </div>

      <div className='grid grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700'>
        <div className='col-span-1'>
          <Checkbox 
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={toggleAll}
            className='data-[static=checked]:bg-blue-600 data-[state=checked]:border-blue-600'          
          />
        </div>
        <div className='col-span-2'>Issued</div>
        <div className='col-span-2'>Serial</div>
        <div className='col-span-3'>Donor</div>
        <div className='col-span-2 text-right'>Amount</div>
        <div className='col-span-1 text-rign'>PDF</div>
        <div className='col-spam-1 text-right'>Del</div> 
      </div>

      {rows.map((r) => {
        const checked = selected.has(r.id);

        return (
          <div 
            key={r.id}
            className='grid grid-cols-12 gap-2 px-3 py-2 border-b last:border-b-0 border-gray-100 text-sm items-center'
          >
            <div className='col-span-1' onClick={(e) => e.stopPropagation()}>
              <Checkbox 
                checked={checked}
                onCheckedChange={() => toggleOne(r.id)}
                className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white'
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
                  className="text-blue-600 hover:underline"
                >
                  Open PDF
                </a>
              ) : (
                <span className="text-muted-foreground">Not generated</span>
              )}
            </div>

            <div className='col-span-1 text-right'>
              <DeleteReceiptButton receiptId={r.id} />
            </div>
          </div>
        )
      })}
    </div>
  );
}

export default ManageReceiptTable;