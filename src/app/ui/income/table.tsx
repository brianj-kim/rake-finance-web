import type { IncomeList } from '@prisma/client';
import { CategoryDTO } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';
import ListActions from './list-actions';


type IncomeTableProps = {
  incomeList: IncomeList[];
  incomeTypes: CategoryDTO[];
  incomeMethods: CategoryDTO[];
}

const formatDate = (y?: number | null, m?: number | null, d?: number | null) => {
  if (!y || !m || !d) return '-';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
;}

const IncomeTable = async ({ incomeList, incomeTypes, incomeMethods }: IncomeTableProps) => {
    
  return (
    <div className='mt-6 flow-root'>
      <div className='w-full align-middle'>
        <div className='rounded-md border border-gray-200 bg-white'>
          
          {/* Mobile cards */}
          <div className='divide-y md:hidden'>
            {incomeList?.map((income) => (
              <div key={income.inc_id} className='p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='truncate font-medium text-gray-900'>
                      {income.name ?? '-'}
                    </div>
                    <div className='nt-1 text-sm test-gray-500'>
                      {formatDate(income.year, income.month, income.day)}
                    </div>
                  </div>

                  <div className='shrink-0'>
                    <div className='text-right text-bases font-semibold text-gray-900'>
                      {formatCurrency(income.amount ?? 0)}
                    </div>
                  </div>
                </div>

                <div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <div className='text-gray-500'>Type</div>
                    <div className='truncate text-gray-900'>{income.type ?? '-'}</div>
                  </div>
                  <div>
                    <div className='text-gray-500'>Method</div>
                    <div className='truncate text-gray-900'>{income.method ?? '-'}</div>
                  </div>

                  <div className='col-span-2'>
                    <div className='text-gray-500'>Note</div>
                    <div className='line-clamp ㅅㄷㅌㅅ-ㅎㄱ묘-900'>
                      {income.notes?.trim() ? income.notes : '-'}
                    </div>
                  </div>
                </div>

                <div className='mt-3 flex justify-end gap-2'>
                  <ListActions 
                    income={income}
                    incomeTypes={incomeTypes}
                    incomeMethods={incomeMethods}
                  />
                </div>
              </div>
            ))}

            {incomeList?.length === 0 && (
              <div className='p-4 text-sm text-gray-600'>No income records found.</div>
            )}
          </div>

          {/* Desktop table */}
          <div className='hidden md:block'>
            <div className='oveflow-x-auto'>
              <table className='w-full table-auto text-gray-900'>
                <thead className='bg-gray-50 text-left text-sm font-medium text-gray-700'>
                  <tr className='[&>th]:whitespace-nowrap'>
                    <th scope='col' className='px-4 py-3 sm:pl-6'>Name</th>
                    <th scope='col' className='px-3 py-3'>Date</th>
                    <th scope='col' className='px-3 py-3 text-right'>Amount</th>
                    <th scope='col' className='px-3 py-3'>Type</th>
                    <th scope='col' className='px-3 py-3'>Method</th>
                    <th scope='col' className='px-3 py-3t'>Note</th>
                    <th scope='col' className='px-3 py-3 text-right sm:pr-6'>Actions</th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-gray-100 bg-white text-sm'>
                  {incomeList?.map((income) => (
                    <tr key={income.inc_id} className='hover:bg-gray-50/50'>
                      <td className='max-w-[220px] truncate px-4 py-3 sm:pl-6'>{income.name ?? '-'}</td>
                      <td className='whitespace-nowrap px-3 py-3 text-gray-700'>
                        {formatDate(income.year, income.month, income.day)}
                      </td>
                      <td className='whitespace-nowrap px-3 py-3 text-right font-medium'>
                        {formatCurrency(income.amount ?? 0)}
                      </td>
                      <td className='max-w-[140px] truncate px-3 py-3 text-gray-700'>
                        {income.type ?? '-'}
                      </td>
                      <td className='max-w-[140px] truncate px-3 py-3 text-gray-700'>
                        {income.method ?? '-'}
                      </td>
                      <td className='min-w-[280px] px-3 py-3 text-gray-700'>
                        <div className='max-w-[520px] truncate'>
                          {income.notes?.trim() ? income.notes : '-'}
                        </div>
                      </td>
                      <td className='whitespace-nowrap px-3 py-3 text-right sm:pl-6'>
                        <div className='flex justify-end gap-2'>
                          <ListActions 
                            income={income}
                            incomeTypes={incomeTypes}
                            incomeMethods={incomeMethods}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {incomeList?.length === 0 && (
                    <tr>
                      <td colSpan={7} className='p-4 text-sm text-gray-600'>
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