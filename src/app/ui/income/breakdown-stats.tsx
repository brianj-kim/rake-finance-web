import Link from 'next/link';
import { formatCurrency } from '@/app/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { View } from 'lucide-react';

type Row = { id: number; name: string; totalCents: number };

const BreakdownStats = ({ title, rows, viewAllHref}: {title: string; rows: Row[]; viewAllHref: string; }) => {
  const total = rows.reduce((a, r) => a + r.totalCents, 0);
  const max = Math.max(1, ...rows.map(r => r.totalCents));

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">Total: {formatCurrency(total)}</div>
        </div>
        <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={viewAllHref}>
          View list
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1 truncate text-sm">{r.name}</div>
            <div className="h-2 w-24 rounded bg-gray-100">
              <div
                className="h-2 rounded bg-blue-600"
                style={{ width: `${Math.round((r.totalCents / max) * 100)}%` }}
              />
            </div>
            <div className="w-24 text-right text-xs">{formatCurrency(r.totalCents)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BreakdownStats;