import { getIncomeMethods, getIncomeTypes } from '@/app/lib/data';
import { prisma } from '@/app/lib/prisma';
import EditIncomeForm from '@/app/ui/income/edit-form';
import { notFound } from 'next/navigation';

const EditIncomePage = async ({
  params,
}: {
  params: { id: string };
  searchParams?: { returnYear?: string };
}) => {  
  const incomeId = Number(params.id);
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
    <main className='w-full'>
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
      />
    </main>
  );
};

export default EditIncomePage;