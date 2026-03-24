import Link from 'next/link';
import { formatCurrency } from '@/app/lib/utils';
import type { ReceiptMemberSummary } from '@/app/lib/definitions';
import { buttonVariants } from '@/components/ui/button';

const ReceiptMemberGrid = (props: {
  members: ReceiptMemberSummary[];
  taxYear: number;
}) => {
  const { members, taxYear } = props;

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((m) => (
        <div
          key={m.memberId}
          className="panel-muted overflow-hidden"
        >
          {/* Header (clickable) */}
          <Link
            href={`/income/receipt/${m.memberId}?year=${taxYear}`}
            className="block cursor-pointer border-b bg-background px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-foreground">{m.kName}</div>
              <div className="text-sm text-muted-foreground truncate">
                {m.oName ? `(${m.oName})` : '(Official name not set)'}
              </div>
            </div>
          </Link>

          {/* Content */}
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Donations:{' '}
                <span className="font-semibold text-foreground">{m.donationCount}</span>
              </div>

              <div className="text-right">
                <div className="text-base font-semibold">
                  {formatCurrency(m.totalCents)}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <div className="text-sm text-muted-foreground">
                Receipt:{' '}
                {m.pdfUrl ? (
                  <span className="font-medium text-foreground">Generated</span>
                ) : (
                  <span className="italic">Not generated</span>
                )}
              </div>

              {m.pdfUrl ? (
                <a
                  href={m.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                >
                  Open PDF
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReceiptMemberGrid;
