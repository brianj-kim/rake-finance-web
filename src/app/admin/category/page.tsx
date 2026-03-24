import { listCategories } from '@/app/lib/admin-actions';
import { requireSuperAdmin } from '@/app/lib/auth';
import CategoriesAdmin from '@/app/ui/admin/categories-admin';
import PageIntro from '@/app/ui/page-intro';

const CategoriesAdminPage = async () => {
  await requireSuperAdmin({ nextPath: '/admin/category' });

  const categories = await listCategories();

  return (
    <main className="space-y-6">
      <PageIntro
        title="Category Admin"
        description="Manage the category structures that power type and method selectors throughout the income workflow."
      />

      <CategoriesAdmin initialRows={categories} />
    </main>
  );
};

export default CategoriesAdminPage;
