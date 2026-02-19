import LoginForm from '@/app/ui/auth/login-form';
import LandingPageHeader from '../ui/landing-header';

const LoginPage = async (props: {
  searchParams?: Promise<{ next?: string }>;
}) => {
  const sp = await props.searchParams;
  const next = sp?.next ?? '/income';

  return (
    <main className="min-h-screen p-6">
      <div className='mb-6 '>
        <LandingPageHeader />
      </div>
      <div className='w-full flex justify-center'>
        <LoginForm next={next} />
      </div>      
    </main>
  )
}

export default LoginPage;
