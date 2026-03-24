import LoginForm from '@/app/ui/auth/login-form';
import LandingPageHeader from '../ui/landing-header';

const LoginPage = async (props: {
  searchParams?: Promise<{ next?: string }>;
}) => {
  const sp = await props.searchParams;
  const next = sp?.next ?? '/income';

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className='mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start'>
        <div className='space-y-6'>
          <LandingPageHeader />
          <div className='panel-muted p-6 text-sm leading-7 text-muted-foreground'>
            Use your assigned admin credentials to access finance operations, member records,
            and receipt workflows. Access is still enforced by role after sign-in.
          </div>
        </div>
        <div className='lg:sticky lg:top-6'>
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  )
}

export default LoginPage;
