'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  EditIncomeFormSchema,
  type CategoryDTO,
  type EditIncomeDTO,
  type EditIncomeFormValues,
} from '../../lib/definitions';
import { updateIncome } from '../../lib/actions';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  income: EditIncomeDTO;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  mode?: 'page' | 'modal';
  showHeader?: boolean;
  onDone?: () => void;
  returnTo?: string;
};

type UpdateIncomeResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof EditIncomeFormValues, string>>;
    };

const optionLabel = (category: CategoryDTO) =>
  category.detail ? `${category.name} (${category.detail})` : category.name;

const EditIncomeForm = ({
  income,
  incomeTypes,
  incomeMethods,
  mode = 'page',
  showHeader = true,
  onDone,
  returnTo,
}: Props) => {
  const router = useRouter();
  const isModal = mode === 'modal';
  const resolvedReturnTo = returnTo?.trim() || '/income/list';

  const form = useForm<EditIncomeFormValues>({
    resolver: zodResolver(EditIncomeFormSchema),
    defaultValues: {
      inc_id: income.inc_id,
      name: income.name ?? '',
      amount: income.amount ?? 0,
      typeId: income.inc_type ?? 0,
      methodId: income.inc_method ?? 0,
      notes: income.notes ?? '',
      year: income.year ?? new Date().getFullYear(),
      month: income.month ?? 1,
      day: income.day ?? 1,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors();

    try {
      const result = (await updateIncome(values)) as UpdateIncomeResult;

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (!message) continue;

            form.setError(field as keyof EditIncomeFormValues, {
              type: 'server',
              message,
            });
          }

          form.setError('root', {
            type: 'server',
            message: result.message,
          });
          return;
        }

        form.setError('root', {
          type: 'server',
          message: result.message,
        });
        toast.error(result.message);
        return;
      }

      toast.success('Income updated successfully.');

      if (isModal) {
        router.refresh();
        onDone?.();
        return;
      }

      router.push(resolvedReturnTo);
      router.refresh();
    } catch (error) {
      console.error('edit income submit error:', error);
      form.setError('root', {
        type: 'server',
        message: 'Failed to update income.',
      });
      toast.error('Failed to update income.');
    }
  });

  const { isSubmitting, errors } = form.formState;

  const content = (
    <div className="space-y-4">
      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Name" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (in cents)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                value={field.value > 0 ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {incomeTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {optionLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="methodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Method</FormLabel>
              <Select
                value={field.value > 0 ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {incomeMethods.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {optionLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Month</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ''}
                rows={4}
                placeholder="Optional"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const header = showHeader ? (
    <div className={isModal ? 'border-b px-6 py-5' : 'mb-5 flex items-center justify-between gap-3'}>
      <div className={isModal ? 'space-y-0.5' : ''}>
        <h1 className="text-xl font-semibold text-foreground">Edit Income</h1>
        {isModal ? (
          <p className="text-sm text-muted-foreground">Income #{income.inc_id}</p>
        ) : null}
      </div>

      {!isModal ? (
        <Link href={resolvedReturnTo} className="text-sm text-primary">
          Back to list
        </Link>
      ) : null}
    </div>
  ) : null;

  const footer = (
    <div className={isModal ? 'border-t px-6 py-4' : ''}>
      <div className={isModal ? 'flex items-center justify-end gap-2' : 'flex items-center justify-end gap-2 pt-2'}>
        {isModal ? (
          <Button type="button" variant="secondary" onClick={() => onDone?.()}>
            Cancel
          </Button>
        ) : (
          <Button type="button" variant="secondary" asChild>
            <Link href={resolvedReturnTo}>Cancel</Link>
          </Button>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Change'}
        </Button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
          {header}
          <div className="flex-1 overflow-y-auto px-6 py-5">{content}</div>
          {footer}
        </form>
      </Form>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      {header}
      <Form {...form}>
        <form onSubmit={onSubmit} className="panel space-y-4 p-6">
          {content}
          {footer}
        </form>
      </Form>
    </div>
  );
};

export default EditIncomeForm;
