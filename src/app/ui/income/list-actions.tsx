'use client';

import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type Props = {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

const ListActions = ({ canUpdate, canDelete, onEdit, onDelete }: Props) => {
  const canOpenEdit = canUpdate && !!onEdit;
  const canOpenDelete = canDelete && !!onDelete;

  return (
    <div className='flex justify-end gap-2'>
      <button 
        type='button'
        onClick={onEdit}
        disabled={!canOpenEdit}
        className='rounded-md border bg-background p-2 text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40'
        aria-label="Edit Income"
      >
        <PencilIcon className='w-5' />
      </button>

      <button
        type='button'
        onClick={onDelete}
        disabled={!canOpenDelete}
        className='rounded-md border bg-background p-2 text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40'
        aria-label='Delete Income'
      >
        <TrashIcon className='w-5' />
      </button>

    </div>
  );
};

export default ListActions;