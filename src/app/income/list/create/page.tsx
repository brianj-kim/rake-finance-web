import { getIncomeMethods, getIncomeTypes } from "@/app/lib/data";
import BatchIncomeForm from "@/app/ui/income/batch-income-form";
import { requirePermission } from '@/app/lib/auth';
import { PERMISSIONS } from '@/app/lib/rbac';

const IncomeBatchPage = async () => {
  await requirePermission(PERMISSIONS.INCOME_CREATE, { nextPath: '/income/list/create' });

  const incomeTypes = await getIncomeTypes();
  const incomeMethods = await getIncomeMethods();

  return (
    <main className='mx-auto w-full max-w-7xl px-2 sm:px-4 pt-1 pb-4'>      
      <BatchIncomeForm incomeTypes={incomeTypes} incomeMethods={incomeMethods} />
    </main>
  );
};

export default IncomeBatchPage;
