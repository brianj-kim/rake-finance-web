'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { type CategoryDTO, type EditIncomeDTO } from '@/app/lib/definitions';
import { getIncomeForEdit } from '@/app/lib/actions';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EditIncomeForm from '@/app/ui/income/edit-form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeId: number | null;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
};

type LoadState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; income: EditIncomeDTO }
  | { status: 'error'; message: string };

const EditIncomeDialog = ({
  open,
  onOpenChange,
  incomeId,
  incomeTypes,
  incomeMethods,
}: Props) => {
  const [loadState, setLoadState] = React.useState<LoadState>({ status: 'idle'});

  React.useEffect(() => {
    if (!open || incomeId == null) {
      setLoadState({ status: 'idle' });
      return;
    }

    let cancelled = false;

    const loadIncome = async () => {
      setLoadState({ status: 'loading' });

      const result = await getIncomeForEdit(incomeId);

      if (cancelled) return;

      if (!result.success) {
        toast.error(result.message);
        setLoadState({
          status: 'error',
          message: result.message,
        });
        return;
      }

      setLoadState({
        status: 'ready',
        income: result.income,
      });
    };

    loadIncome();
    
    return () => {
      cancelled = true;
    };
  }, [open, incomeId]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setLoadState({ status: 'idle'});
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='w=[95vw] sm:max-w-4xl lg:max-w-5xl'>
        {loadState.status === 'loading' ? (
          <p className='text-sm text-muted-foreground'>Loading...</p>
        ) : null}

        {loadState.status === 'error' ? (
          <div className='space-y-4'>
            <p className='text-sm text-destructive'>{loadState.message}</p>
            <div className='flex justify-end'>
              <Button type='button' variant='secondary' onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}

        {loadState.status === 'ready' ? (
          <EditIncomeForm 
            key={loadState.income.inc_id}
            income={loadState.income}
            incomeTypes={incomeTypes}
            incomeMethods={incomeMethods}
            mode='modal'
            onDone={() => handleOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default EditIncomeDialog;