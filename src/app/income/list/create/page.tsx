import { getIncomeMethods, getIncomeTypes } from "@/app/lib/data";
import BatchIncomeForm from "@/app/ui/income/batch-income-form";
import { requireFinanceAccess } from '@/app/lib/auth';
import PageIntro from "@/app/ui/page-intro";

const IncomeBatchPage = async () => {
  await requireFinanceAccess({ nextPath: '/income/list/create' });

  const incomeTypes = await getIncomeTypes();
  const incomeMethods = await getIncomeMethods();

  return (
    <main className='space-y-6'>
      <PageIntro
        title="Create Income Entries"
        description="Capture multiple donations on the same day with live totals, type grouping, and method breakdowns."
      />
      <BatchIncomeForm incomeTypes={incomeTypes} incomeMethods={incomeMethods} />
    </main>
  );
};

export default IncomeBatchPage;
