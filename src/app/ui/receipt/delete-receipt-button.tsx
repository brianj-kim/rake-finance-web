'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { deleteReceiptAndFile } from '@/app/lib/receipt-actions';

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

const DeleteReceiptButton = (props: { receiptId: string}) => {
  const { receiptId } = props;

  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteReceiptAndFile({ receiptId });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success('Receipt delete.');
      router.refresh();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' size='sm' disabled={pending}>
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this receipt?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the database record and the PDF file. This action can't be undeon.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={pending}>
            {pending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteReceiptButton;