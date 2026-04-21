'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  UpdateMemberFormSchema,
  type UpdateMemberFormValues,
} from '@/app/lib/definitions';
import { getMemberForEdit, updateMember } from '@/app/lib/member-actions';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open:boolean) => void;
  memberId: number | null;
};

type GetMemberForEditResult = 
  | {
      success: true;
      member: {
        mbr_id: number;
        name_kFull: string;
        name_eFirst: string | null;
        name_eLast: string | null;
        email: string | null;
        address: string | null;
        city: string | null;
        province: string | null;
        postal: string | null;
        note: string | null;
      };
    }
  | {
      success: false;
      message: string
    };

type UpdateMemberResult = 
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof UpdateMemberFormValues, string>>;
    };     

const emptyValues: UpdateMemberFormValues = {
  mbr_id: 0,
  name_kFull: '',
  name_eFirst: '',
  name_eLast: '',
  email: '',
  address: '',
  city: '',
  province: '',
  postal: '',
  note: '',
};
    
const EditMemberDialog = ({ open, onOpenChange, memberId }: Props) => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const form = useForm<UpdateMemberFormValues>({
    resolver: zodResolver(UpdateMemberFormSchema),
    defaultValues: emptyValues
  });

  React.useEffect(() => {
    if (!open || memberId == null) {
      setLoaded(false);
      form.reset(emptyValues);
      return;
    }

    let cancelled = false;

    const loadMember = async () => {
      setLoading(true);
      setLoaded(false);
      form.clearErrors();

      try {
        const res = (await getMemberForEdit(memberId)) as GetMemberForEditResult;

        if (cancelled) return;

        if (!res.success) {
          toast.error(res.message);
          onOpenChange(false);
          return;
        }

        form.reset({
          mbr_id: res.member.mbr_id,
          name_kFull: res.member.name_kFull,
          name_eFirst: res.member.name_eFirst ?? '',
          name_eLast: res.member.name_eLast ?? '',
          email: res.member.email ?? '',
          address: res.member.address ?? '',
          city: res.member.city ?? '',
          province: res.member.province ?? '',
          postal: res.member.postal ?? '',
          note: res.member.note ?? '',
        });

        setLoaded(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMember();

    return () => {
      cancelled = true;
    };
  }, [open, memberId, form, onOpenChange]);

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors();

    try {
      const res = (await updateMember(values)) as UpdateMemberResult;

      if (!res.success) {
        if (res.fieldErrors) {
          for (const [field, message] of Object.entries(res.fieldErrors)) {
            if (!message) continue;

            form.setError(field as keyof UpdateMemberFormValues, {
              type: 'server',
              message,
            });
          }
        }

        toast.error('res.message');
        return;
      }

      toast.success('Member updated.');
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error('UpdateMember submit error:', err);

      form.setError('root', {
        type: 'server',
        message: 'Failed to update member',
      });

      toast.error('Failed to update member.')
    }
  });

  const { isSubmitting, errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-130'>
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='py-6 text-sm text-muted-foreground'>Loading...</div>
        ) : (
          <Form {...form} >
            <form onSubmit={onSubmit} className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {errors.root?.message ? (
                <div className='md:col-span-2 text-sm text-destructive'>
                  {errors.root.message}
                </div>
              ) : null}

              <FormField 
                control={form.control}
                name='name_kFull'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Name (Korean, not changeable)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        value={field.value ?? ''}
                        disabled
                        className='bg-muted font-semibold'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name_eFirst"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name (Official)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="First Name"
                        autoComplete="given-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name_eLast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name (Official)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Last Name"
                        autoComplete="family-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="name@example.com"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="123 Example St"
                        autoComplete="street-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Regina"
                        autoComplete="address-level2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Saskatchewan"
                        autoComplete="address-level1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="S4P3W3"
                        autoComplete="postal-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Memo</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Optional memo for the member"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
                <Button 
                  type='button'
                  variant='ghost'
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={!loaded || isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>

            </form>
          </Form>
        )}

      </DialogContent>
    </Dialog>
  )
}

export default EditMemberDialog;