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
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Monthly */}
      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium">Monthly totals</div>
        <div className="mt-3 space-y-2">
          {monthly.map((m) => (
            <div key={m.month} className="flex items-center gap-3">
              <div className="w-10 text-xs text-muted-foreground">{monthNames[m.month - 1]}</div>
              <div className="h-2 flex-1 rounded bg-gray-100">
                <div
                  className="h-2 rounded bg-blue-600"
                  style={{ width: `${Math.round((m.totalCents / maxMonth) * 100)}%` }}
                />
              </div>
              <div className="w-28 text-right text-xs">{formatCurrency(m.totalCents)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarterly */}
      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium">Quarterly totals</div>
        <div className="mt-3 space-y-2">
          {quarterly.map((q) => (
            <div key={q.quarter} className="flex items-center gap-3">
              <div className="w-10 text-xs text-muted-foreground">{`Q${q.quarter}`}</div>
              <div className="h-2 flex-1 rounded bg-gray-100">
                <div
                  className="h-2 rounded bg-blue-600"
                  style={{ width: `${Math.round((q.totalCents / maxQt) * 100)}%` }}
                />
              </div>
              <div className="w-28 text-right text-xs">{formatCurrency(q.totalCents)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MonthlyQuarterlyStats;