"use client";

import { useState } from 'react';
import type { IncomeList } from '@prisma/client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { deleteIncome } from '@/app/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/app/lib/utils';


type Props = {
  income: IncomeList;
  onClose: () => void;
}

const DeleteIncomeDialog = ({ income, onClose }: Props) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteIncome(income.inc_id!);

      if (!result.success) {
        throw new Error('Faild to delete income');
      }

      toast.success('Income deleted ssuccessfully');
      router.refresh();
      onClose();
    } catch (error) {
      toast.error('Failed to delte income.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent >
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the income entry for <strong>{income.name}</strong> with amount{" "} 
            <strong>{formatCurrency(income.amount! / 100)}</strong> from{" "}
            <strong>{`${income.year}-${income.month}-${income.day}`}</strong>
            <br />
            <br />
            This actioni cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter >
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-red-600 hover:bg-red-700'
          >
            {isDeleting ? 'Deleting...' : 'Dlete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteIncomeDialog;