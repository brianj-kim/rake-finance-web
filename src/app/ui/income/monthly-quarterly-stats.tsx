import { formatCurrency } from "@/app/lib/utils";

type Monthly = { month: number; totalCents: number };
type Quarterly = { quarter: number; totalCents: number };

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyQuarterlyStats = ({
  monthly,
  quarterly,
}: { 
  monthly: Monthly[];
  quarterly: Quarterly[];
}) => {
  const maxMonth = Math.max(1, ...monthly.map(m => m.totalCents));
  const maxQt = Math.max(1, ...quarterly.map(q => q.totalCents));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Monthly */}
      <div className="panel-muted p-5">
        <div className="page-eyebrow">Trendline</div>
        <div className="mt-2 text-lg font-semibold text-foreground">Monthly totals</div>
        <div className="mt-4 space-y-3">
          {monthly.map((m) => (
            <div key={m.month} className="flex items-center gap-3">
              <div className="w-10 text-xs text-muted-foreground">{monthNames[m.month - 1]}</div>
              <div className="h-2.5 flex-1 rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-primary"
                  style={{ width: `${Math.round((m.totalCents / maxMonth) * 100)}%` }}
                />
              </div>
              <div className="w-28 text-right text-xs text-foreground">{formatCurrency(m.totalCents)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarterly */}
      <div className="panel-muted p-5">
        <div className="page-eyebrow">Rollup</div>
        <div className="mt-2 text-lg font-semibold text-foreground">Quarterly totals</div>
        <div className="mt-4 space-y-3">
          {quarterly.map((q) => (
            <div key={q.quarter} className="flex items-center gap-3">
              <div className="w-10 text-xs text-muted-foreground">{`Q${q.quarter}`}</div>
              <div className="h-2.5 flex-1 rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-primary"
                  style={{ width: `${Math.round((q.totalCents / maxQt) * 100)}%` }}
                />
              </div>
              <div className="w-28 text-right text-xs text-foreground">{formatCurrency(q.totalCents)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MonthlyQuarterlyStats;
