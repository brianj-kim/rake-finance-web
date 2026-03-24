import MemberCreateForm from '@/app/ui/income/member-create-form';
import Link from 'next/link';
import { requireFinanceAccess } from '@/app/lib/auth';
import PageIntro from '@/app/ui/page-intro';
import { buttonVariants } from '@/components/ui/button';

const CreateMemberPage = async () => {
  await requireFinanceAccess({ nextPath: '/income/member/create' });

  return (
    <main className='space-y-6'>
      <PageIntro
        title="Create Member"
        description="Add a donor profile with the details needed for communications, donation tracking, and annual receipts."
        actions={
          <Link className={buttonVariants({ variant: 'outline' })} href='/income/member'>
            Back to Members
          </Link>
        }
      />

      <MemberCreateForm />
    </main>
  );
}

export default CreateMemberPage;
