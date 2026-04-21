'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { deleteReceiptsAndFiles } from '@/app/lib/receipt-actions';

type ReceiptRowRef = {
  id: string;
};

type BulkState = {
  selected: Set<string>;
  confirmOpen: boolean;
};

type BulkAction = 
  | { type: 'sync-visible-rows'; ids: string[] }
  | { type: 'toggle-one'; id: string }
  | { type: 'toggle-all'; ids: string[] }
  | { type: 'open-confirm' }
  | { type: 'close-confirm' }
  | { type: 'clear' };

const createInitialBulkState = (): BulkState => ({
  selected: new Set<string>(),
  confirmOpen: false,
});

const areAllVisibleSelected = (selected: Set<string>, ids: string[]) => 
  ids.length > 0 && ids.every((id) => selected.has(id));

const bulkReducer = (state: BulkState, action: BulkAction): BulkState => {
  switch (action.type) {
    case 'sync-visible-rows': {
      const visibleIds = new Set(action.ids);
      const nextSelected = new Set(
        Array.from(state.selected).filter((id) => visibleIds.has(id))
      );

      if (nextSelected.size === state.selected.size) {
        if (state.confirmOpen && nextSelected.size === 0) {
          return { ...state, confirmOpen: false };
        }
        return state;
      }

      return {
        selected: nextSelected,
        confirmOpen: nextSelected.size > 0 ? state.confirmOpen : false,
      };
    }

    case 'toggle-one': {
      const nextSelected = new Set(state.selected);

      if (nextSelected.has(action.id)) {
        nextSelected.delete(action.id);
      } else {
        nextSelected.add(action.id);
      }

      return {
        selected: nextSelected,
        confirmOpen: false,
      };
    }

    case 'toggle-all': {
      const nextSelected = areAllVisibleSelected(state.selected, action.ids)
        ? new Set<string>()
        : new Set(action.ids);

      return {
        selected: nextSelected,
        confirmOpen: false,
      };
    }

    case 'open-confirm':
      if (state.selected.size === 0) return state;
      return { ...state, confirmOpen: true };

    case 'close-confirm':
      if (!state.confirmOpen) return state;
      return { ...state, confirmOpen: false };

    case 'clear':
      return createInitialBulkState();

    default:
      return state;
  }
};

const useReceiptBulkActions = (rows: ReceiptRowRef[]) => {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const visibleIds = React.useMemo(() => rows.map((row) => row.id), [rows]);

  const [state, dispatch] = React.useReducer(
    bulkReducer,
    undefined,
    createInitialBulkState
  );

  React.useEffect(() => {
    dispatch({ type: 'sync-visible-rows', ids: visibleIds });
  }, [visibleIds]);

  const selectedCount = state.selected.size;
  const allSelected = areAllVisibleSelected(state.selected, visibleIds);
  const someSelected = selectedCount > 0 && !allSelected;
  
  const toggleAll = () => {
    if (pending) return;
    dispatch({ type: 'toggle-all', ids: visibleIds });
  };

  const toggleOne = (id: string) => {
    if (pending) return;
    dispatch({ type: 'toggle-one', id });
  };

  const requestBulkDelete = () => {
    if (pending || selectedCount === 0) return;
    dispatch({ type: 'open-confirm' });
  };

  const closeBulkDelete = () => {
    dispatch({ type: 'close-confirm' });
  };

  const confirmBulkDelete = () => {
    const receiptIds = Array.from(state.selected.values());

    if (receiptIds.length === 0) {
      dispatch({ type: 'close-confirm' });
      return;
    }

    startTransition(async () => {
      const res = await deleteReceiptsAndFiles({ receiptIds });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(`Cancelled ${res.deleted} receipt(s).`);
      dispatch({ type: 'clear' });
      router.refresh();
    });
  };

  return {
    selected: state.selected,
    pending,
    selectedCount,
    allSelected,
    someSelected,
    confirmOpen: state.confirmOpen,
    toggleAll,
    toggleOne,
    requestBulkDelete,
    closeBulkDelete,
    confirmBulkDelete,
  };
};

export default useReceiptBulkActions;
