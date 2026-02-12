import { getIncomeMethods, getIncomeTypes } from "@/app/lib/data";
import BatchIncomeForm from "@/app/ui/income/batch-income-form";

const IncomeBatchPage = async () => {
  const incomeTypes = await getIncomeTypes();
  const incomeMethods = await getIncomeMethods();

  return (
    <main className='mx-auto w-full max-w-7xl px-2 sm:px-4 pt-1 pb-4'>      
      <BatchIncomeForm incomeTypes={incomeTypes} incomeMethods={incomeMethods} />
    </main>
  );
};

export default IncomeBatchPage;