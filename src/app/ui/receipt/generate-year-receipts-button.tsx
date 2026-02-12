'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { generateReceiptsForYearBatch } from '@/app/lib/receipt-actions';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const GenerateYearReceiptsButton = (props: { taxYear: number }) => {
  const { taxYear } = props;

  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const run = () => {
    startTransition(async () => {
      let cursor = 0;
      let created = 0;
      let skipped = 0;
      let failed = 0;

      while (true) {
        const res = await generateReceiptsForYearBatch({ taxYear, cursor, batchSize: 20 });

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        created += res.created;
        skipped += res.skipped;
        failed += res.failed;

        toast.message(`Generating ${taxYear} receipts...`, {
          description: `Created ${created}, skipped ${skipped}, failed ${failed}. Check console/logs for detailes.`,
        });

        if (res.nextCursor == null) break;
        cursor = res.nextCursor;
      } 

      if (failed > 0) {
        toast.warning(`Done with some failrues`, {
          description: `Created ${created}, skipped: ${skipped}, failed ${failed}. Check console/logs for details.`,
        });
      } else {
        toast.success(`Done`, {
          description: `Created ${created}, skipped ${skipped}.`,
        });
      }

      router.refresh();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={pending} className='bg-blue-600 border-blue-600 hover:bg-blue-700'>
          {pending ? 'Generating...' : `Generate ${taxYear} receipts`}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent >
        <AlertDialogHeader>
          <AlertDialogTitle>Cenerate receipts for {taxYear}?</AlertDialogTitle>            
          <AlertDialogDescription>
          This will generate receipts for every member who has offerings greater than 0 in {taxYear}.
          Existing receipts for {taxYear} will be skipped.
        </AlertDialogDescription>          
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={run} disabled={pending}>
          {pending ? 'Generating...' : 'Generate'}
        </AlertDialogAction>
      </AlertDialogFooter>
        
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GenerateYearReceiptsButton;