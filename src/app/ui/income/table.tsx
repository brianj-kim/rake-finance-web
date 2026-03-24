import type { IncomeList } from '@prisma/client';
import { CategoryDTO } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';
import ListActions from './list-actions';


type IncomeTableProps = {
  incomeList: IncomeList[];
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
  canUpdateIncome: boolean;
  canDeleteIncome: boolean;
}

const formatDate = (y?: number | null, m?: number | null, d?: number | null) => {
  if (!y || !m || !d) return '-';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
;}

const IncomeTable = async ({
  incomeList,
  incomeTypes,
  incomeMethods,
  canUpdateIncome,
  canDeleteIncome,
}: IncomeTableProps) => {
    
  return (
    <div className='mt-6 flow-root'>
      <div className='w-full align-middle'>
        <div className='panel overflow-hidden'>
          
          {/* Mobile cards */}
          <div className='divide-y divide-white/8 md:hidden'>
            {incomeList?.map((income) => (
              <div key={income.inc_id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='truncate font-medium text-foreground'>
                      {income.name ?? '-'}
                    </div>
                    <div className='mt-1 text-sm text-muted-foreground'>
                      {formatDate(income.year, income.month, income.day)}
                    </div>
                  </div>

                  <div className='shrink-0'>
                    <div className='text-right text-base font-semibold text-foreground'>
                      {formatCurrency(income.amount ?? 0)}
                    </div>
                  </div>
                </div>

                <div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <div className='text-muted-foreground'>Type</div>
                    <div className='truncate text-foreground'>{income.type ?? '-'}</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground'>Method</div>
                    <div className='truncate text-foreground'>{income.method ?? '-'}</div>
                  </div>

                  <div className='col-span-2'>
                    <div className='text-muted-foreground'>Note</div>
                    <div className='line-clamp-2 text-foreground'>
                      {income.notes?.trim() ? income.notes : '-'}
                    </div>
                  </div>
                </div>

                <div className='mt-3 flex justify-end gap-2'>
                  <ListActions 
                    income={income}
                    incomeTypes={incomeTypes}
                    incomeMethods={incomeMethods}
                    canUpdate={canUpdateIncome}
                    canDelete={canDeleteIncome}
                  />
                </div>
              </div>
            ))}

            {incomeList?.length === 0 && (
              <div className='p-5 text-sm text-muted-foreground'>No income records found.</div>
            )}
          </div>

          {/* Desktop table */}
          <div className='hidden md:block'>
            <div className='overflow-x-auto'>
              <table className='w-full table-auto text-foreground'>
                <thead className='bg-muted text-left text-sm font-medium text-muted-foreground'>
                  <tr className='[&>th]:whitespace-nowrap'>
                    <th scope='col' className='px-4 py-3 sm:pl-6'>Name</th>
                    <th scope='col' className='px-3 py-3'>Date</th>
                    <th scope='col' className='px-3 py-3 text-right'>Amount</th>
                    <th scope='col' className='px-3 py-3'>Type</th>
                    <th scope='col' className='px-3 py-3'>Method</th>
                    <th scope='col' className='px-3 py-3'>Note</th>
                    <th scope='col' className='px-3 py-3 text-right sm:pr-6'>Actions</th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-white/8 text-sm'>
                  {incomeList?.map((income) => (
                    <tr key={income.inc_id}>
                      <td className='max-w-55 truncate px-4 py-3 sm:pl-6'>{income.name ?? '-'}</td>
                      <td className='whitespace-nowrap px-3 py-3 text-muted-foreground'>
                        {formatDate(income.year, income.month, income.day)}
                      </td>
                      <td className='whitespace-nowrap px-3 py-3 text-right font-medium'>
                        {formatCurrency(income.amount ?? 0)}
                      </td>
                      <td className='max-w-35 truncate px-3 py-3 text-muted-foreground'>
                        {income.type ?? '-'}
                      </td>
                      <td className='max-w-35 truncate px-3 py-3 text-muted-foreground'>
                        {income.method ?? '-'}
                      </td>
                      <td className='min-w-70 px-3 py-3 text-muted-foreground'>
                        <div className='max-w-130 truncate'>
                          {income.notes?.trim() ? income.notes : '-'}
                        </div>
                      </td>
                      <td className='whitespace-nowrap px-3 py-3 text-right sm:pl-6'>
                        <div className='flex justify-end gap-2'>
                          <ListActions 
                            income={income}
                            incomeTypes={incomeTypes}
                            incomeMethods={incomeMethods}
                            canUpdate={canUpdateIncome}
                            canDelete={canDeleteIncome}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {incomeList?.length === 0 && (
                    <tr>
                      <td colSpan={7} className='p-5 text-sm text-muted-foreground'>
                        No income records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  ); 
}

export default IncomeTable;
