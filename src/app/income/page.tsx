import Link from "next/link";
import { lusitana } from "@/app/ui/fonts";
import YearSelect from "@/app/ui/income/year-select";
import PageIntro from "@/app/ui/page-intro";

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
import { requireFinanceAccess } from '@/app/lib/auth';

const IncomeDash = async ({ searchParams }: { searchParams: Promise<{ year?: string }> }) => {
    await requireFinanceAccess({ nextPath: '/income' });

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
      <main className="space-y-6">
        <PageIntro
          title="Income Dashboard"
          description="Monitor annual performance, track month-by-month donation patterns, and keep receipt readiness in view."
          actions={
            <div className="panel-muted flex items-center gap-3 px-4 py-3">
              <label htmlFor="year" className="text-sm font-medium text-muted-foreground">
                Year
              </label>
              <YearSelect selectedYear={selectedYear} years={years} />
            </div>
          }
        />

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCards
              year={selectedYear}
              yearTotalCents={kpi.yearTotalCents}
              monthTotalCents={kpi.monthTotalCents}
              donationCount={kpi.donationCount}
              uniqueDonors={kpi.uniqueDonors}
            />
          </div>

          <MonthlyQuarterlyStats monthly={monthly} quarterly={quarterly} />

          <div className="grid gap-4 lg:grid-cols-2">
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

          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <ReceiptStatsCard {...receiptStats} />
            <div className="panel-muted p-5">
              <div className="page-eyebrow">Quick Routes</div>
              <div className={`${lusitana.className} mt-3 text-xl font-semibold text-foreground`}>
                Keep the workflow moving
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                Jump directly into the areas most teams touch every week.
              </div>

              <div className="mt-5 space-y-3">
                <Link
                  href={`/income/list?year=${selectedYear}`}
                  className="flex items-center justify-between rounded-lg border bg-background px-4 py-4 text-sm text-foreground"
                >
                  <span>Review the full income list</span>
                  <span className="text-primary">Open</span>
                </Link>
                <Link
                  href="/income/list/create"
                  className="flex items-center justify-between rounded-lg border bg-background px-4 py-4 text-sm text-foreground"
                >
                  <span>Start a new batch entry</span>
                  <span className="text-primary">Create</span>
                </Link>
                <Link
                  href="/income/member"
                  className="flex items-center justify-between rounded-lg border bg-background px-4 py-4 text-sm text-foreground"
                >
                  <span>Manage member tax details</span>
                  <span className="text-primary">Browse</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
};

export default IncomeDash;
