import { formatCurrency } from "@/app/lib/utils";

type Props = {
  year: number;
  yearTotalCents: number;
  monthTotalCents: number;
  donationCount: number;
  uniqueDonors: number;
};

const StatCard = ({ title, value, sub }: { title: string; value: string; sub?: string }) => (
  <div className='rounded-md border border-gray-200 bg-white p-4 shadow-sm'>
    <div className='text-sm text-muted-foreground'>{title}</div>
    <div className='mt-2 text-2xl font-semibold'>{value}</div>
    {sub ? <div className='mt-1 text-sx text-muted-foreground'>{sub}</div> : null}
  </div>
);

const KpiCards = (props: Props) => {
  const { year, yearTotalCents, monthTotalCents, donationCount, uniqueDonors } = props;

  return (
    <>
      <StatCard title={`Total income (${year})`} value={formatCurrency(yearTotalCents)} />
      <StatCard title='This Month' value={formatCurrency(monthTotalCents)} sub='Current month total' />
      <StatCard title='uniqueDonors' value={String(uniqueDonors)} sub='Distinct members with donations' />
    </>
  )
}

export default KpiCards;