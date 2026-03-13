import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import { toInt } from '@/app/lib/utils';

import { getMemberDonationsForYear, getReceiptMemberInfo } from '@/app/lib/receipt-data';
import DonationSelector from '@/app/ui/receipt/donation-selector';
import MemberDetailActions from '@/app/ui/receipt/member-detail-actions';
import { canAccess, requirePermission } from '@/app/lib/auth';
import { PERMISSIONS } from '@/app/lib/rbac';

export const runtime = 'nodejs';

const ReceiptMemberPage = async (props: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ year?: string }>;
}) => {
  await requirePermission(PERMISSIONS.RECEIPT_READ, { nextPath: '/income/receipt' });

  const params = await props.params;
  const searchParams = await props.searchParams;

  const memberId = Number(params.memberId);
  const currentYear = new Date().getFullYear();
  const selectedYear = toInt(searchParams?.year) ?? currentYear

  const [member, donations, canEditMember, canGenerateReceipt] = await Promise.all([
    getReceiptMemberInfo({ memberId: memberId }),
    getMemberDonationsForYear({ memberId: memberId, taxYear: selectedYear }),
    canAccess(PERMISSIONS.MEMBER_UPDATE),
    canAccess(PERMISSIONS.RECEIPT_GENERATE),
  ]);

  if (!member) {
    return (
      <main>
        <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
          Donation Review (Selector)
        </h1>
        <div className='text-sm text-gray-600'>Member not found.</div>
      </main>
    );
  }

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Donation Review (Selector)
      </h1>

      <div className='flex justify-between mb-4'>
        <div className='flex space-x-2'>
          <Link 
            href={`/income/receipt?year=${selectedYear}`}
            className='rounded-md border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50'
          >
            Back
          </Link>
        </div>

        <div>
          <Link 
            href={`/income/receipt/${memberId}?year=${selectedYear}`}
            className='rounded-md border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50'
          >
            Refresh
          </Link>
        </div>
      </div>

      {/* Member Details */}
      <div className='mb-4 rounded-md border border-gray-200 p-4'>
        <div className='flex items-start justify-between gap-3 mb-4'>
          <div className='min-w-0'>
            <div className='text-sm text0muted-foreground'>Member</div>
            <div className='mt-1 text-base font-semibold truncate'>{member.name_kFull}</div>
            <div className='text-sm text-muted-foreground'>{member.nameOfficial}</div>
          </div>
        </div>

        {canEditMember ? <MemberDetailActions memberId={memberId} /> : null}
      </div>

      <DonationSelector
        memberId={memberId}
        taxYear={selectedYear}
        donations={donations}
        canGenerateReceipt={canGenerateReceipt}
      />
    </main>
  )
}

export default ReceiptMemberPage;
