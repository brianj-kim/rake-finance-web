import Link from 'next/link';
import { requireSuperAdmin } from '@/app/lib/auth';
import { lusitana } from '@/app/ui/fonts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ModuleCard = {
  title: string;
  description: string;
  href: string;
  enabled?: boolean;
};

const AdminDashboardPage = async () => {
  await requireSuperAdmin({ nextPath: '/admin' });

  const modules: ModuleCard[] = [
    {
      title: 'Charity Profile',
      description: 'Manage the official charity details used in donation receipts.',
      href: '/admin/charity',
    },
    {
      title: 'Category Admin',
      description: 'Manage income type and method categories.',
      href: '/admin/category',
    },
    {
      title: 'Future Admin Tools',
      description: 'Reserved landing slots for housekeeping and broader project-wide settings.',
      href: '/admin',
      enabled: false,
    },
  ];

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Admin Dashboard</h1>
      <p className='mb-6 text-sm text-gray-600'>Choose an admin module below.</p>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {modules.map((module) =>
          module.enabled !== false ? (
            <Link key={module.href} href={module.href} className='block'>
              <Card className='border-gray-200 transition-colors hover:border-blue-300 hover:bg-blue-50/40'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className='text-sm text-blue-700'>Open module</CardContent>
              </Card>
            </Link>
          ) : (
            <Card key={module.href} className='border-gray-200 opacity-70'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base'>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className='text-sm text-gray-500'>Planned</CardContent>
            </Card>
          )
        )}
      </div>
    </main>
  );
};

export default AdminDashboardPage;
