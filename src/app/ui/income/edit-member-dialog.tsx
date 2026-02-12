'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { EditMemberDTO } from '../../lib/definitions';
import { getMemberForEdit, updateMember } from '../../lib/member-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';



const FormSchema = z.object({
  mbr_id: z.number(),
  name_kFull: z.string().min(1, 'Required'),
  name_eFirst: z.string().optional(),
  name_eLast: z.string().optional(),
  email: z.email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal: z.string().optional(),
  note: z.string().optional()
});

type FormValues = z.infer<typeof FormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: number | null;
};

const EditMemberDialog = ({ open, onOpenChange, memberId }: Props) => {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [member, setMember] = React.useState<EditMemberDTO | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mbr_id: 0,
      name_kFull: '',
      name_eFirst: '',
      name_eLast: '',
      email: '',
      address: '',
      city: '',
      province: '',
      postal: '',
      note: ''
    },
  });

  React.useEffect(() => {
    if (!open || !memberId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const res = await getMemberForEdit(memberId);
      setLoading(false);

      if (cancelled) return;

      if (!res.success) {
        toast.error(res.message);
        onOpenChange(false);
        return;
      }

      setMember(res.member);

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
        note: res.member.note ?? ''
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, memberId, form, onOpenChange]);

  const onSubmit = async (values: FormValues) => {
    const res = await updateMember(values);

    if (!res.success) {
      if (res.fieldErrors) {
        for (const [field, message] of Object.entries(res.fieldErrors)) {
          form.setError(field as keyof FormValues, { type: 'server', message });
        }
      }

      toast.error(res.message);
      return;
    }

    toast.success('Member updated.');
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='py-6 text-sm text-muted-foreground'>Loading...</div>
        ) : (
          <Form {...form} >
            <form onSubmit={form.handleSubmit(onSubmit)} className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField 
                control={form.control}
                name='name_kFull'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Name (Korean, not changeable)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className='bg-muted font-semibold' />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='name_eFirst'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name (Official)</FormLabel>
                    <FormControl>
                      <Input placeholder='First Name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='name_eLast'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name (Official)</FormLabel>
                    <FormControl>
                      <Input placeholder='Last Name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='name@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder='123 Example St' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='city'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder='Regina' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='province'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province</FormLabel>
                    <FormControl>
                      <Input placeholder='Saskatchewan' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='postal'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal</FormLabel>
                    <FormControl>
                      <Input placeholder='S4P 3W3' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control}
                name='note'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Memo</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Optional Memo for the member' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
                <Button type='button' variant='ghost' onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={!member}>
                  Save
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