'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import EditMemberDialog from '../income/edit-member-dialog';

const MemberDetailActions = (props: { memberId: number }) => {
  const { memberId } = props;
  const [openEdit, setOpenEdit] = React.useState(false);

  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpenEdit(true)}>
        Edit
      </Button>

      <EditMemberDialog open={openEdit} onOpenChange={setOpenEdit} memberId={memberId} />
    </>
  )
}

export default MemberDetailActions;