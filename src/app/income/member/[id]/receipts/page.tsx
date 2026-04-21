import Link from 'next/link';
import { ReceiptStatus } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { formatCurrency } from '@/app/lib/utils';

import GenerateReceiptForm from '@/app/ui/receipt/generate-receipt-form';
import { canAccessFinance, requireFinanceAccess } from '@/app/lib/auth';
import PageIntro from '@/app/ui/page-intro';
import { buttonVariants } from '@/components/ui/button';

const RECEIPT_VISIBLE_STATUSES: ReceiptStatus[] = [
  ReceiptStatus.issued,
  ReceiptStatus.replacement,
];

const MemberReceiptsPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  await requireFinanceAccess({ nextPath: '/income/member' });

  const { id } = await props.params;
  const memberId = Number(id);
  const canGenerateReceipt = await canAccessFinance();

  const member = await prisma.member.findUnique({
    where: { mbr_id: memberId },
    select: {
      mbr_id: true,
      name_kFull: true,
      name_eFirst: true,
      name_eLast: true,
      address: true,
      city: true,
      province: true,
      postal: true,
      email: true,
    },
  });

  if (!member) {
    return <main>Member not found.</main>;
  }

  const receipts = await prisma.receipt.findMany({
    where: { memberId, status: { in: RECEIPT_VISIBLE_STATUSES } },
    orderBy: [{ taxYear: 'desc' }, { serialNumber: 'desc' }],
    select: {
      id: true,
      taxYear: true,
      issueDate: true,
      serialNumber: true,
      totalCents: true,
      eligibleCents: true,
      pdfUrl: true,
    },
  });

  const englishName =
    [member.name_eFirst, member.name_eLast].filter(Boolean).join(' ') || '-';

  return (
    <main className="space-y-6">
      <PageIntro
        title="Donation Receipts"
        description={`${member.name_kFull} (${englishName})`}
        actions={
          <>
            <Link href="/income/member" className={buttonVariants({ variant: 'outline' })}>
              Back to members
            </Link>
            {canGenerateReceipt ? <GenerateReceiptForm memberId={memberId} /> : null}
          </>
        }
      />

      <div className="panel overflow-hidden">
        <div className="grid grid-cols-5 gap-2 border-b bg-muted px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <div>Tax Year</div>
          <div>Serial</div>
          <div>Issued</div>
          <div className="text-right">Eligible</div>
          <div className="text-right">PDF</div>
        </div>

        {receipts.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">No receipts yet.</div>
        ) : (
          receipts.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-5 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <div>{r.taxYear}</div>
              <div>{String(r.serialNumber).padStart(5, '0')}</div>
              <div>{new Date(r.issueDate).toLocaleDateString()}</div>
              <div className="text-right font-medium">
                {formatCurrency(r.eligibleCents)}
              </div>
              <div className="text-right">
                {r.pdfUrl ? (
                  <a
                  className="inline-flex justify-center rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white"
                  href={r.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open PDF
                </a>
                ) : (
                  <span className='inline-flex justify-center rounded-xl border px-3 py-2 text-sm text-muted-foreground'>
                    Not generated
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default MemberReceiptsPage;
