'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CategoryDTO, EditIncomeDTO } from '../../lib/definitions';
import { updateIncome } from '../../lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';



type Props = {
  income: EditIncomeDTO;
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  mode?: 'page' | 'modal';
  onDone?: () => void;
  returnTo?: string;
};

type FieldErrors = Record<string, string[] | undefined>;

type UpdateIncomeResult = 
  | { success: true }
  | { success: false; message?: string; errors?: FieldErrors };

const pickfirstError = (errors: FieldErrors | undefined, key: string): string | null => {
  const msg = errors?.[key]?.[0];
  return typeof msg === 'string' && msg.trim() ? msg: null;
};  

const EditIncomeForm = ({ 
  income, 
  incomeTypes, 
  incomeMethods,
  mode = 'page',
  onDone,
  returnTo
}: Props) => {
  const router = useRouter();
  const isModal = mode === 'modal';

  const [name, setName] = useState(income.name ?? '');
  const [amount, setAmount] = useState(income.amount ?? 0);
  const [type, setType] = useState(String(income.inc_type ?? 0));
  const [method, setMethod] = useState(String(income.inc_method ?? 0));
  const [notes, setNotes] = useState(income.notes ?? '');
  const [year, setYear] = useState(income.year ?? new Date().getFullYear());
  const [month, setMonth] = useState(income.month ?? 1);
  const [day, setDay] = useState(income.day ?? 1);

  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const returnToUrl = useMemo(() => {
    if (returnTo && returnTo.trim()) return returnTo;
    return '/income/list';
  }, [returnTo]);

  const getError = (key: string) => pickfirstError(fieldErrors, key);
  
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("amount", String(amount));
      fd.set("type", type);
      fd.set("method", method);
      fd.set("notes", notes);
      fd.set("year", String(year));
      fd.set("month", String(month));
      fd.set("day", String(day));
      
      const result = (await updateIncome(income.inc_id, fd)) as UpdateIncomeResult;

      if (!result.success) {
        if(result.errors) {
          setFieldErrors(result.errors);
          setFormError(result.message ?? 'Pleases fix the highlighted fields.');
          return;
        }
        setFormError(result.message ?? 'Failed to update income.');
        toast.error(result.message ?? 'Failed to update income.');
        return;
      }

      toast.success('Income updated successfully.');
      if(isModal) {
        router.refresh();
        onDone?.();
      } else {
        router.push(returnToUrl);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to update income.');
      toast.error('Failed to update income.')
    } finally {
      setIsSaving(false);
    }
  };

  const Header = (
    <div className={isModal ? 'border-b px-6 py-5' : 'mb-4 flex items-center justify-between gap-3'}>
      <div className={isModal ? 'space-y-0.5' : ''}>
        <h1 className='text-xl font-sembold'>Edit Income</h1>
        {isModal ? (
          <p className='text-sm text-muted-foreground'>Income #{income.inc_id}</p>
        ) : null}
      </div>

      {!isModal ? (
        <Link href={returnToUrl} className='text-sm underline'>
          Back to list
        </Link>
      ) : null}
    </div>
  );

  const Footer = (
    <div className={isModal ? 'border-t px-6 py-4' : ''}>
      <div className={isModal ? 'flex items-center justify-end gap-2' : 'flex items-center justify-end gap-2 pt-2'}>
        {isModal ? (
          <Button type='button' variant='secondary' onClick={() => onDone?.()} >
            Cancel
          </Button>
        ) : (
          <Button type="button" variant="secondary" asChild>
            <Link href={returnToUrl}>Cancel</Link>
          </Button>
        )}

        <Button type='submit' disabled={isSaving} >
          {isSaving ? 'Saving...' : 'Save Change'}
        </Button>
      </div>
    </div>
  );

  const FormFields = (
    <div className='space-y-4'>
      {formError ? <p className='text-sm text-destructive'>{formError}</p> : null}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Member</label>
          <Input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Name'
            aria-invalid={!!getError('name')}
          />
          {getError('name') ? <p className='text-sm text-destructive'>{getError('name')}</p> : null}
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Amount (in cents)</label>
          <Input 
            type='number'
            inputMode='decimal'
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
            aria-invalid={!!getError('amount')}
          />
          {getError('amount') ? <p className='text-sm text-destructive'>{getError('amount')}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger aria-invalid={!!getError("type")}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {incomeTypes.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getError("type") ? <p className="text-sm text-destructive">{getError("type")}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Method</label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger aria-invalid={!!getError("method")}>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {incomeMethods.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getError("method") ? <p className="text-sm text-destructive">{getError("method")}</p> : null}
        </div>      
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Year</label>
          <Input
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value === "" ? 0 : Number(e.target.value))}
            aria-invalid={!!getError("year")}
          />
          {getError("year") ? <p className="text-sm text-destructive">{getError("year")}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Month</label>
          <Input
            type="number"
            inputMode="numeric"
            value={month}
            onChange={(e) => setMonth(e.target.value === "" ? 0 : Number(e.target.value))}
            aria-invalid={!!getError("month")}
          />
          {getError("month") ? <p className="text-sm text-destructive">{getError("month")}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Day</label>
          <Input
            type="number"
            inputMode="numeric"
            value={day}
            onChange={(e) => setDay(e.target.value === "" ? 0 : Number(e.target.value))}
            aria-invalid={!!getError("day")}
          />
          {getError("day") ? <p className="text-sm text-destructive">{getError("day")}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Optional"
          aria-invalid={!!getError("notes")}
        />
        {getError("notes") ? <p className="text-sm text-destructive">{getError("notes")}</p> : null}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <form onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
        {Header}
        <div className="flex-1 overflow-y-auto px-6 py-5">{FormFields}</div>
        {Footer}
      </form>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      {Header}
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-6 shadow-sm">
        {FormFields}
        {Footer}
      </form>
    </div>
  )

}

export default EditIncomeForm;