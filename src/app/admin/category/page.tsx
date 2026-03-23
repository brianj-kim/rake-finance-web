import { listCategories } from '@/app/lib/admin-actions';
import { requireSuperAdmin } from '@/app/lib/auth';
import CategoriesAdmin from '@/app/ui/admin/categories-admin';
import { lusitana } from '@/app/ui/fonts';

const CategoriesAdminPage = async () => {
  await requireSuperAdmin({ nextPath: '/admin/category' });

  const categories = await listCategories();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Category Admin</h1>
      <p className='mb-6 text-sm text-gray-600'>
        Manage income categories for type and method selectors.
      </p>

      <CategoriesAdmin initialRows={categories} />
    </main>
  );
};

export default CategoriesAdminPage;
