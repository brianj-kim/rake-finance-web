import { lusitana } from '@/app/ui/fonts';
import LoginForm from '@/app/ui/auth/login-form';

const LoginPage = async (props: {
  searchParams?: Promise<{ next?: string }>;
}) => {
  const sp = await props.searchParams;
  const next = sp?.next ?? '/income';

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <LoginForm next={next} />
    </main>
  )
}

export default LoginPage;