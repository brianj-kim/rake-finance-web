import { lusitana } from "@/app/ui/fonts";
import YearSelect from "@/app/ui/income/year-select";

import { 
	getIncomeKpis, 
	getMonthlyTotals, 
	getQuarterlyTotals, 
	getTypeBreakdown, 
	getMethodBreakdown 
} from "@/app/lib/data";
import { 	getReceiptStats } from '@/app/lib/receipt-data';

import KpiCards from "@/app/ui/income/kpi-cards";
import ReceiptStatsCard from "@/app/ui/income/receipt-stats";
import MonthlyQuarterlyStats from "@/app/ui/income/monthly-quarterly-stats";
import BreakdownStats from "@/app/ui/income/breakdown-stats";

const IncomeDash = async ({ searchParams }: { searchParams: Promise<{ year?: string }> }) => {
    const params = await searchParams;
    const currentYear = new Date().getFullYear();
    const selectedYear = params?.year ? Number(params.year) : currentYear;
    const years = Array.from({ length: 5}, (_, idx) => currentYear - idx);

    const [kpi, receiptStats, monthly, quarterly, byType, byMethod] = await Promise.all([
    getIncomeKpis(selectedYear),
    getReceiptStats(selectedYear), // or selectedYear - 1 if you prefer tax-year logic
    getMonthlyTotals(selectedYear),
    getQuarterlyTotals(selectedYear),
    getTypeBreakdown(selectedYear),
    getMethodBreakdown(selectedYear),
  ]);
    
    return (
        <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Income Dashboard</h1>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="year" className="text-sm font-medium">Year:</label>
        <YearSelect selectedYear={selectedYear} years={years} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <KpiCards
          year={selectedYear}
          yearTotalCents={kpi.yearTotalCents}
          monthTotalCents={kpi.monthTotalCents}
          donationCount={kpi.donationCount}
          uniqueDonors={kpi.uniqueDonors}
        />
      </div>

      <div className="mt-3 grid gap-3 grid-cols-1">        
        <MonthlyQuarterlyStats monthly={monthly} quarterly={quarterly} />				
      </div>

      <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
        <BreakdownStats
          title="By Type"
          rows={byType}
          viewAllHref={`/income/list?year=${selectedYear}`}
        />
        <BreakdownStats
          title="By Method"
          rows={byMethod}
          viewAllHref={`/income/list?year=${selectedYear}`}
        />
      </div>

      <div className='mt-3'>
				<ReceiptStatsCard {...receiptStats} />
			</div>
    </main>
  );
};

export default IncomeDash;