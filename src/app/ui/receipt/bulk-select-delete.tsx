'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { deleteReceiptsAndFiles } from '@/app/lib/receipt-actions';

const useReceiptBulkActions = (rows: Array<{ id: string }>) => {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [pending, startTransition] = React.useTransition();

  const allIds = React.useMemo(() => rows.map((r) => r.id), [rows]);
  const selectedCount = selected.size;

  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === rows.length) return new Set();
      return new Set(allIds);
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = () => {
    if (selectedCount === 0) return;

    const ok = window.confirm(
      `Delete ${selectedCount} receipt(s)?\n\nThis will delete the database rows and the PDF files.`
    );
    if (!ok) return;

    const receiptIds = Array.from(selected.values());

    startTransition(async () => {
      const res = await deleteReceiptsAndFiles({ receiptIds });
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(`Deleted ${res.deleted} receipt(s).`);
      setSelected(new Set());
      router.refresh();
    });
  };

  return {
    selected,
    pending,
    selectedCount,
    allSelected,
    someSelected,
    toggleAll,
    toggleOne,
    bulkDelete,
  };
};

export default useReceiptBulkActions;