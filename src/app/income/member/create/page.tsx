import MemberCreateForm from '@/app/ui/income/member-create-form';
import Link from 'next/link';

const CreateMemberPage = () => {
  return (
    <main className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold md:text-2xl'>Create Member</h1>
        <Link className='text-sm underline' href='/income/member'>
          Back to Members
        </Link>
      </div>

      <MemberCreateForm />
    </main>
  );
}

export default CreateMemberPage;