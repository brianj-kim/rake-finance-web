'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { CategoryDTO, EditIncomeDTO } from '../../lib/definitions';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import EditIncomeForm from './edit-form';

const EditIncomeDialog = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeId: number | null;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
}) => {
  const { open, onOpenChange, incomeId, incomeTypes, incomeMethods } = props;

  const [income, setIncome] = React.useState<EditIncomeDTO | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !incomeId) return;

    let cancelled = false;


    const load = async () => {
      setLoading(true);
      setIncome(null);

      try {
        const res = await fetch(`/api/income/${incomeId}`, { cache: 'no-store'});
        if (!res.ok) throw new Error(`Failed to load income (${res.status})`);
        const data = (await res.json()) as EditIncomeDTO;

        if (!cancelled) setIncome(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load income for editing');
        onOpenChange(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, incomeId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className='w-[95vw] sm:max-w-4xl lg:max-w-5xl'>
        {loading ? (
          <p className='text-sm text-muted-foreground'>Loading...</p>
        ) : income ? (
          <EditIncomeForm 
            income={income}
            incomeTypes={incomeTypes}
            incomeMethods={incomeMethods}
            mode='modal'
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default EditIncomeDialog;