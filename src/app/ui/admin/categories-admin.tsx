'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createCategory,
  deleteCategory,
  type CategoryAdminRow,
  updateCategory,
} from '@/app/lib/admin-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Props = {
  initialRows: CategoryAdminRow[];
};

type CategoryRange = 'inc' | 'imd';

type CategoryFormValues = {
  range: CategoryRange;
  name: string;
  detail: string;
  order: string;
  isParent: boolean;
};

const EMPTY_FORM: CategoryFormValues = {
  range: 'inc',
  name: '',
  detail: '',
  order: '',
  isParent: false,
};

const toEditFormValues = (row: CategoryAdminRow): CategoryFormValues => ({
  range: row.range === 'imd' ? 'imd' : 'inc',
  name: row.name ?? '',
  detail: row.detail ?? '',
  order: row.order == null ? '' : String(row.order),
  isParent: Boolean(row.isParent),
});

const setCategoryFormData = (formData: FormData, values: CategoryFormValues) => {
  formData.set('range', values.range);
  formData.set('name', values.name);
  formData.set('detail', values.detail);
  if (values.order.trim()) formData.set('order', values.order.trim());
  if (values.isParent) formData.set('isParent', 'on');
};

const CategoriesAdmin = ({ initialRows }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [createValues, setCreateValues] = React.useState<CategoryFormValues>(EMPTY_FORM);
  const [createErrors, setCreateErrors] = React.useState<Record<string, string>>({});

  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editValues, setEditValues] = React.useState<CategoryFormValues>(EMPTY_FORM);
  const [editErrors, setEditErrors] = React.useState<Record<string, string>>({});
  const editErrorMessage = editErrors.form ?? Object.values(editErrors)[0];

  const handleCreateValueChange =
    <K extends keyof CategoryFormValues>(key: K) =>
    (value: CategoryFormValues[K]) => {
      setCreateValues((prev) => ({ ...prev, [key]: value }));
      setCreateErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

  const handleEditValueChange =
    <K extends keyof CategoryFormValues>(key: K) =>
    (value: CategoryFormValues[K]) => {
      setEditValues((prev) => ({ ...prev, [key]: value }));
      setEditErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateErrors({});

    startTransition(async () => {
      const formData = new FormData();
      setCategoryFormData(formData, createValues);

      const result = await createCategory(formData);
      if (!result.success) {
        if (result.fieldErrors) setCreateErrors(result.fieldErrors);
        toast.error(result.message);
        return;
      }

      toast.success('Category created.');
      setCreateValues(EMPTY_FORM);
      router.refresh();
    });
  };

  const startEdit = (row: CategoryAdminRow) => {
    setEditingId(row.id);
    setEditValues(toEditFormValues(row));
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const submitEdit = (categoryId: number) => {
    setEditErrors({});

    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(categoryId));
      setCategoryFormData(formData, editValues);

      const result = await updateCategory(formData);
      if (!result.success) {
        if (result.fieldErrors) setEditErrors(result.fieldErrors);
        toast.error(result.message);
        return;
      }

      toast.success('Category updated.');
      setEditingId(null);
      router.refresh();
    });
  };

  const submitDelete = (row: CategoryAdminRow) => {
    if (!window.confirm(`Delete category "${row.name}"?`)) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(row.id));

      const result = await deleteCategory(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (editingId === row.id) setEditingId(null);
      toast.success('Category deleted.');
      router.refresh();
    });
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Create Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitCreate} className='grid grid-cols-1 gap-3 md:grid-cols-6'>
            <div className='space-y-1'>
              <label htmlFor='create-range' className='text-sm font-medium'>
                Range
              </label>
              <select
                id='create-range'
                className='h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground outline-none'
                value={createValues.range}
                onChange={(event) => handleCreateValueChange('range')(event.target.value as CategoryRange)}
              >
                <option value='inc'>inc</option>
                <option value='imd'>imd</option>
              </select>
              {createErrors.range ? <p className='text-sm text-red-600'>{createErrors.range}</p> : null}
            </div>

            <div className='space-y-1 md:col-span-2'>
              <label htmlFor='create-name' className='text-sm font-medium'>
                Name
              </label>
              <Input
                id='create-name'
                value={createValues.name}
                onChange={(event) => handleCreateValueChange('name')(event.target.value)}
                aria-invalid={Boolean(createErrors.name)}
              />
              {createErrors.name ? <p className='text-sm text-red-600'>{createErrors.name}</p> : null}
            </div>

            <div className='space-y-1 md:col-span-2'>
              <label htmlFor='create-detail' className='text-sm font-medium'>
                Detail
              </label>
              <Input
                id='create-detail'
                value={createValues.detail}
                onChange={(event) => handleCreateValueChange('detail')(event.target.value)}
                aria-invalid={Boolean(createErrors.detail)}
              />
              {createErrors.detail ? <p className='text-sm text-red-600'>{createErrors.detail}</p> : null}
            </div>

            <div className='space-y-1'>
              <label htmlFor='create-order' className='text-sm font-medium'>
                Order
              </label>
              <Input
                id='create-order'
                type='number'
                min={0}
                value={createValues.order}
                onChange={(event) => handleCreateValueChange('order')(event.target.value)}
                aria-invalid={Boolean(createErrors.order)}
              />
              {createErrors.order ? <p className='text-sm text-red-600'>{createErrors.order}</p> : null}
            </div>

            <div className='flex items-center gap-2 md:col-span-4'>
              <input
                id='create-parent'
                type='checkbox'
                checked={createValues.isParent}
                onChange={(event) => handleCreateValueChange('isParent')(event.target.checked)}
                className='h-4 w-4 rounded border'
              />
              <label htmlFor='create-parent' className='text-sm'>
                Is Parent
              </label>
            </div>

            <div className='md:col-span-2 md:justify-self-end'>
              <Button type='submit' disabled={pending}>
                {pending ? 'Saving...' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Existing Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {editErrorMessage ? <p className='mb-3 text-sm text-red-600'>{editErrorMessage}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Depth</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialRows.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <select
                          className='h-9 rounded-xl border bg-background px-3 text-sm text-foreground outline-none'
                          value={editValues.range}
                          onChange={(event) =>
                            handleEditValueChange('range')(event.target.value as CategoryRange)
                          }
                        >
                          <option value='inc'>inc</option>
                          <option value='imd'>imd</option>
                        </select>
                      ) : (
                        row.range ?? '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editValues.name}
                          onChange={(event) => handleEditValueChange('name')(event.target.value)}
                          className='h-8'
                        />
                      ) : (
                        row.name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editValues.detail}
                          onChange={(event) => handleEditValueChange('detail')(event.target.value)}
                          className='h-8'
                        />
                      ) : (
                        row.detail ?? '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type='number'
                          min={0}
                          value={editValues.order}
                          onChange={(event) => handleEditValueChange('order')(event.target.value)}
                          className='h-8 w-24'
                        />
                      ) : row.order == null ? (
                        '-'
                      ) : (
                        row.order
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <input
                          type='checkbox'
                          checked={editValues.isParent}
                          onChange={(event) => handleEditValueChange('isParent')(event.target.checked)}
                          className='h-4 w-4 rounded border'
                        />
                      ) : row.isParent ? (
                        'Yes'
                      ) : (
                        'No'
                      )}
                    </TableCell>
                    <TableCell>{row.depth ?? '-'}</TableCell>
                    <TableCell className='text-right'>
                      {isEditing ? (
                        <div className='inline-flex items-center gap-2'>
                          <Button
                            size='sm'
                            onClick={() => submitEdit(row.id)}
                            disabled={pending}
                            type='button'
                          >
                            {pending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button size='sm' variant='secondary' onClick={cancelEdit} type='button'>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className='inline-flex items-center gap-2'>
                          <Button size='sm' variant='secondary' onClick={() => startEdit(row)} type='button'>
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => submitDelete(row)}
                            disabled={pending}
                            type='button'
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriesAdmin;
