import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

type Props = {
  taxYear: number;
  totalMembers: number;
  generatedCount: number;
  notGeneratedCount: number;
};

const ReceiptStatsCard = (props: Props) => {
  const { taxYear, totalMembers, generatedCount, notGeneratedCount }  = props;

  return (
    <div className='rounded-md border border-gray-200 bg-white p-4 shadow-sm' >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='text-sm text-muted-foreground'>Receipts ({taxYear})</div>
          <div className='mt-2 text-2xl font-semibold'>{generatedCount}</div>
          <div className='text-xs text-muted-foreground'>Generated</div>
        </div>

        <Link
          href={`/income/receipt/?year=${taxYear}`}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          Go to receipts
        </Link>
      </div>

      <div className='mt-3 grid grid-cols-3 gap-3 text-sm'>
        <div className='rounded-md bg-gray-50 p-2'>
          <div className='text-muted-foreground text-xs'>Total</div>
          <div className='font-medium'>{totalMembers}</div>
        </div>
        <div className='rounded-md bg-gray-50 p-2'>
          <div className='text-muted-foreground text-xs'>Generated</div>
          <div className='font-medium'>{generatedCount}</div>
        </div>
        <div className='rounded-md bg-gray-50 p-2'>
          <div className='text-muted-foreground text-xs'>Not yet</div>
          <div className='font-medium'>{notGeneratedCount}</div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptStatsCard;