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
    <div className='panel-muted p-5' >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <div className='page-eyebrow'>Receipts ({taxYear})</div>
          <div className='mt-3 text-3xl font-semibold text-foreground'>{generatedCount}</div>
          <div className='text-sm text-muted-foreground'>Generated</div>
        </div>

        <Link
          href={`/income/receipt/?year=${taxYear}`}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          Go to receipts
        </Link>
      </div>

      <div className='mt-5 grid grid-cols-3 gap-3 text-sm'>
        <div className='rounded-lg border bg-muted p-3'>
          <div className='text-muted-foreground text-xs uppercase'>Total</div>
          <div className='mt-2 font-medium text-foreground'>{totalMembers}</div>
        </div>
        <div className='rounded-lg border bg-muted p-3'>
          <div className='text-muted-foreground text-xs uppercase'>Generated</div>
          <div className='mt-2 font-medium text-foreground'>{generatedCount}</div>
        </div>
        <div className='rounded-lg border bg-muted p-3'>
          <div className='text-muted-foreground text-xs uppercase'>Not yet</div>
          <div className='mt-2 font-medium text-foreground'>{notGeneratedCount}</div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptStatsCard;
