'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createMember } from '../../lib/member-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const Schema = z.object({
  name_kFull: z.string().min(1, 'Required'),
  name_eFirst: z.string().optional(),
  name_eLast: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal: z.string().optional(),
  note: z.string().optional()
});

type FormValues = z.infer<typeof Schema>;

const MemberCreateForm = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name_kFull: '',
      name_eFirst: '',
      name_eLast: '',
      email: '',
      address: '',
      city: '',
      province: '',
      postal: '',
      note: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);

    const res = await createMember(values);

    if (!res.success) {
      if (res.fieldErrors) {
        for (const [field, message] of Object.entries(res.fieldErrors)) {
          form.setError(field as keyof FormValues, { type: 'server', message });
        }
      }
      toast.error(res.message);
      setSubmitting(false);
      return;
    }

    toast.success('Member created.');
    setSubmitting(false);

    router.push('/income/member');
    router.refresh();
  };

  return (
    <Card>
      <CardContent className='pt-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormField 
              control={form.control}
              name='name_kFull'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Name (Korean)</FormLabel>
                  <FormControl>
                    <Input placeholder='홍길동' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField 
              control={form.control}
              name='name_eFirst'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name (English)</FormLabel>
                  <FormControl>
                    <Input placeholder='Brian' {...field} />
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
                  <FormLabel>Last Name (Englishs)</FormLabel>
                  <FormControl >
                    <Input placeholder='Kim' {...field} />
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
                  <FormControl >
                    <Input placeholder='123 Exampe St' {...field} />
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
                    <Input placeholder='SK' {...field} />
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
                <FormItem>
                  <FormLabel>Memo</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Memo or note for the member' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className='md:col-span-2 flex justify-end gap-2 pt-2'>
              <Button type='button' variant='ghost' onClick={() => router.push('/income/member')}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Member'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default MemberCreateForm;