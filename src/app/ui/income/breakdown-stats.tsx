import Link from 'next/link';
import { formatCurrency } from '@/app/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type Row = { id: number; name: string; totalCents: number };

const BreakdownStats = ({ title, rows, viewAllHref}: {title: string; rows: Row[]; viewAllHref: string; }) => {
  const total = rows.reduce((a, r) => a + r.totalCents, 0);
  const max = Math.max(1, ...rows.map(r => r.totalCents));

  return (
    <div className="panel-muted p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="page-eyebrow">{title}</div>
          <div className="mt-2 text-lg font-semibold text-foreground">Total {formatCurrency(total)}</div>
        </div>
        <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={viewAllHref}>
          View list
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1 truncate text-sm text-foreground">{r.name}</div>
            <div className="h-2.5 w-24 rounded-full bg-muted">
              <div
                className="h-2.5 rounded-full bg-primary"
                style={{ width: `${Math.round((r.totalCents / max) * 100)}%` }}
              />
            </div>
            <div className="w-24 text-right text-xs text-foreground">{formatCurrency(r.totalCents)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BreakdownStats;
