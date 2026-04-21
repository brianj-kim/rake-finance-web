'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  CreateMemberFormSchema,
  type CreateMemberFormValues,
} from '@/app/lib/definitions';
import { createMember } from '@/app/lib/member-actions';

import { Card, CardContent } from '@/components/ui/card';
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

type CreateMemberResult = 
  | { success: true; memberId: number }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof CreateMemberFormValues, string>>;
    };

const MemberCreateForm = () => {
  const router = useRouter();

  const form = useForm<CreateMemberFormValues>({
    resolver: zodResolver(CreateMemberFormSchema),
    defaultValues: {
      name_kFull: '',
      name_eFirst: '',
      name_eLast: '',
      email: '',
      address: '',
      city: '',
      province: '',
      postal: '',
      note: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors();

    try {
      const res = (await createMember(values)) as CreateMemberResult;

      if (!res.success) {
        if (res.fieldErrors) {
          for (const [field, message] of Object.entries(res.fieldErrors)) {
            if (!message) continue;

            form.setError(field as keyof CreateMemberFormValues, {
              type: 'server',
              message,
            });
          }
        }

        form.setError('root', {
          type: 'server',
          message: res.message,
        });

        toast.error(res.message);
        return;
      }

      toast.success('Member created.');
      router.push('/income/member');
      router.refresh();
    } catch (err) {
      console.error('createMember submit error:', err);

      form.setError('root', {
        type: 'server',
        message: 'Failed to create member.',
      });

      toast.error('Failed to create member.');
    }
  });

  const { isSubmitting, errors } = form.formState;

  return (
    <Card>
      <CardContent className='pt-6'>
        <Form {...form}>
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
                  <FormLabel>Name (Korean)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                      placeholder='홍길동'
                      autoComplete='off'
                    />
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
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Brian'
                      autoComplete='given-name'
                    />
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
                  <FormLabel>Last Name (English)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Kim'
                      autoComplete='family-name'
                    />
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
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                      placeholder='name@example.com'
                      autoComplete='email'
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
                      placeholder="SK"
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
                      placeholder="Memo or note for the member"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='md:col-span-2 flex justify-end gap-2 border-t pt-4'>
              <Button 
                type='button'
                variant='ghost'
                onClick={() => router.push('/income/member')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create Member'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default MemberCreateForm;
