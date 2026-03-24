'use client';

import { useState } from 'react';
import type { IncomeList } from '@prisma/client';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CategoryDTO } from '@/app/lib/definitions';
import DeleteIncomeDialog from '@/app/ui/income/delete-income-dialog';
import EditIncomeDialog from './edit-income-dialog';

type Props = {
  income: IncomeList;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  canUpdate: boolean;
  canDelete: boolean;
};

const ListActions = ({ income, incomeTypes, incomeMethods, canUpdate, canDelete }: Props) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const id = income.inc_id ?? undefined;

  return (
    <div className='flex justify-end gap-2'>
      {typeof id === 'number' && canUpdate ? (
        <button
          type='button'
          onClick={() => setEditOpen(true)}
          className='rounded-xl border bg-background p-2 text-muted-foreground'
          aria-label='Edit Income'
        >
          <PencilIcon className='w-5' />
        </button>
      ) : (
        <span className='rounded-xl border bg-muted p-2 text-slate-300' aria-hidden='true'>
          <PencilIcon className='w-5' />
        </span>
      )}

      <button
        type='button'
        onClick={() => setDeleteOpen(true)}
        disabled={typeof id !== 'number' || !canDelete}
        className='rounded-xl border bg-background p-2 text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40'
        aria-label='Delete Income'        
      >
        <TrashIcon className='w-5' />
      </button>

      {deleteOpen && typeof id === 'number' && canDelete ? (
        <DeleteIncomeDialog income={income} onClose={() => setDeleteOpen(false)} />
      ) : null}

      {editOpen && typeof id === 'number' && canUpdate ? (
        <EditIncomeDialog 
          open={editOpen}
          onOpenChange={setEditOpen}
          incomeId={id}
          incomeTypes={incomeTypes}
          incomeMethods={incomeMethods}
        />
      ) : null}
    </div>
  );
}

export default ListActions;
