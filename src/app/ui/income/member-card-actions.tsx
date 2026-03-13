'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import EditMemberDialog from '@/app/ui/income/edit-member-dialog';

type Props = {
  memberId: number;
  canUpdate: boolean;
};

const MemberCardActions = ({ memberId, canUpdate }: Props) => {
  const [openEdit, setOpenEdit] = React.useState(false);
  // const [deleting, setDeleting] = React.useState(false);

  // const onDelete = async () => {
  //   const ok = window.confirm(
  //     "Delete this member?\n\nIf the member has income records, deletion may fail."
  //   );
  //   if (!ok) return;

  //   setDeleting(true);
  //   const res = await deleteMember(mbrId);
  //   setDeleting(false);

  //   if (!res.success) {
  //     toast.error(res.message);
  //     return;
  //   }

  //   toast.success('Member deleted.');
  // };

  return (
    <>
      <div className='flex items-center justify-end gap-2'>
        {/* <Button 
          type='button'
          size='sm'
          variant='outline'
          className='bg-gray-100 hover:bg-gray-200'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.replace(`/income/member/${memberId}/receipts`)
          }}
        >
          Receipts
        </Button> */}

        {canUpdate ? (
          <Button size='sm' variant='outline' onClick={() => setOpenEdit(true)}>
            Edit
          </Button>
        ) : null}

        {/* <Button size='sm' variant='secondary' onClick={onDelete} disabled={deleting} >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button> */}
      </div>

      {canUpdate ? <EditMemberDialog open={openEdit} onOpenChange={setOpenEdit} memberId={memberId} /> : null}
    </>
  )
}

export default MemberCardActions;
