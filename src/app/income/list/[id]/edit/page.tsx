import { getIncomeMethods, getIncomeTypes } from '@/app/lib/data';
import { prisma } from '@/app/lib/prisma';
import EditIncomeForm from '@/app/ui/income/edit-form';
import { notFound } from 'next/navigation';
import { requireFinanceAccess } from '@/app/lib/auth';
import PageIntro from '@/app/ui/page-intro';

const EditIncomePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnYear?: string }>;
}) => {  
  await requireFinanceAccess({ nextPath: '/income/list' });

  const { id } = await params;
  const incomeId = Number(id);
  if (!Number.isInteger(incomeId) || incomeId <= 0) notFound();

  const [income, incomeTypes, incomeMethods] = await Promise.all([
    prisma.income.findUnique({
      where: { inc_id: incomeId },
      include: { Member: { select: { name_kFull: true, mbr_id: true }}}
    }),
    getIncomeTypes(),
    getIncomeMethods()
  ]);

  if (!income) notFound();

  return (
    <main className='space-y-6'>
      <PageIntro
        title="Edit Income"
        description="Update the selected donation record, then return to the filtered list view."
      />
      <EditIncomeForm
        income={{
          inc_id: income.inc_id,
          name: income.Member?.name_kFull ?? '',
          amount: income.amount ?? 0,
          inc_type: income.inc_type ?? 0,
          inc_method: income.inc_method ?? 0,
          notes: income.notes ?? '',
          year: income.year ?? new Date().getFullYear(),
          month: income.month ?? 1,
          day: income.day ?? 1,
        }}
        incomeTypes={incomeTypes}
        incomeMethods={incomeMethods}
        showHeader={false}
      />
    </main>
  );
};

export default EditIncomePage;
