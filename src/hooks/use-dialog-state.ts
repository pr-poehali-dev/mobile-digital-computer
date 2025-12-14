import { useState } from 'react';

export interface DialogState<T = unknown> {
  open: boolean;
  item: T | null;
}

export interface DeleteDialogState {
  open: boolean;
  id: string | number | null;
  type?: 'one' | 'all';
}

export function useDialogState<T>() {
  const [editState, setEditState] = useState<DialogState<T>>({ 
    open: false, 
    item: null 
  });
  
  const [createState, setCreateState] = useState(false);
  
  const [deleteState, setDeleteState] = useState<DeleteDialogState>({ 
    open: false, 
    id: null 
  });

  const openEdit = (item: T) => setEditState({ open: true, item });
  const closeEdit = () => setEditState({ open: false, item: null });

  const openCreate = () => setCreateState(true);
  const closeCreate = () => setCreateState(false);

  const openDelete = (id: string | number, type?: 'one' | 'all') => 
    setDeleteState({ open: true, id, type });
  const closeDelete = () => setDeleteState({ open: false, id: null });

  return {
    edit: {
      state: editState,
      open: openEdit,
      close: closeEdit,
      setState: setEditState
    },
    create: {
      state: createState,
      open: openCreate,
      close: closeCreate,
      setState: setCreateState
    },
    delete: {
      state: deleteState,
      open: openDelete,
      close: closeDelete,
      setState: setDeleteState
    }
  };
}
