import Link from 'next/link';
import { prisma } from '@/app/lib/prisma';
import { lusitana } from '@/app/ui/fonts';
import { formatCurrency } from '@/app/lib/utils';

import GenerateReceiptForm from '@/app/ui/receipt/generate-receipt-form';

const MemberReceiptsPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const memberId = Number(id);

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
    where: { memberId },
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
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Donation Receipts
      </h1>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            {member.name_kFull} ({englishName})
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
          <Link
            href="/income/member"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 text-center"
          >
            Back to members
          </Link>

          <div className='sm:min-2-[360px]'>
            <GenerateReceiptForm memberId={memberId} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-gray-200">
        <div className="grid grid-cols-5 gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
          <div>Tax Year</div>
          <div>Serial</div>
          <div>Issued</div>
          <div className="text-right">Eligible</div>
          <div className="text-right">PDF</div>
        </div>

        {receipts.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No receipts yet.</div>
        ) : (
          receipts.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b last:border-b-0 border-gray-100 items-center"
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
                  className="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 inline-flex justify-center"
                  href={r.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open PDF
                </a>
                ) : (
                  <span className='rounded-md border px-3 py-2 text-sm text-muted-foreground inline-flex justify-center'>
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
