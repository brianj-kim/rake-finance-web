import { formatCurrency } from "@/app/lib/utils";

type Props = {
  year: number;
  yearTotalCents: number;
  monthTotalCents: number;
  donationCount: number;
  uniqueDonors: number;
};

const StatCard = ({ title, value, sub }: { title: string; value: string; sub?: string }) => (
  <div className='stat-tile'>
    <div className='text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground'>{title}</div>
    <div className='mt-4 text-3xl font-semibold text-foreground'>{value}</div>
    {sub ? <div className='mt-2 text-sm text-muted-foreground'>{sub}</div> : null}
  </div>
);

const KpiCards = (props: Props) => {
  const { year, yearTotalCents, monthTotalCents, donationCount, uniqueDonors } = props;

  return (
    <>
      <StatCard title={`Total income (${year})`} value={formatCurrency(yearTotalCents)} />
      <StatCard title='This Month' value={formatCurrency(monthTotalCents)} sub='Current month total' />
      <StatCard title='Donations' value={String(donationCount)} sub='Total donation records in selected year' />
      <StatCard title='Unique Donors' value={String(uniqueDonors)} sub='Distinct members with donations' />
    </>
  )
}

export default KpiCards;
