import Link from 'next/link';
import { toInt } from '@/app/lib/utils';

import { getMemberDonationsForYear, getReceiptMemberInfo } from '@/app/lib/receipt-data';
import DonationSelector from '@/app/ui/receipt/donation-selector';
import MemberDetailActions from '@/app/ui/receipt/member-detail-actions';
import { canAccessFinance, requireFinanceAccess } from '@/app/lib/auth';
import PageIntro from '@/app/ui/page-intro';
import { buttonVariants } from '@/components/ui/button';

export const runtime = 'nodejs';

const ReceiptMemberPage = async (props: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ year?: string }>;
}) => {
  await requireFinanceAccess({ nextPath: '/income/receipt' });

  const params = await props.params;
  const searchParams = await props.searchParams;

  const memberId = Number(params.memberId);
  const currentYear = new Date().getFullYear();
  const selectedYear = toInt(searchParams?.year) ?? currentYear

  const [member, donations, canManageFinance] = await Promise.all([
    getReceiptMemberInfo({ memberId: memberId }),
    getMemberDonationsForYear({ memberId: memberId, taxYear: selectedYear }),
    canAccessFinance(),
  ]);

  if (!member) {
    return (
      <main>
        <PageIntro
          title="Donation Review"
          description="The requested member record could not be found."
        />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <PageIntro
        title="Donation Review"
        description="Choose the included donations for this member, then generate a clean annual receipt."
        actions={
          <>
            <Link href={`/income/receipt?year=${selectedYear}`} className={buttonVariants({ variant: 'outline' })}>
              Back
            </Link>
            <Link href={`/income/receipt/${memberId}?year=${selectedYear}`} className={buttonVariants({ variant: 'secondary' })}>
              Refresh
            </Link>
          </>
        }
      />

      {/* Member Details */}
      <div className='panel-muted p-5'>
        <div className='mb-4 flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='page-eyebrow'>Member</div>
            <div className='mt-3 truncate text-lg font-semibold text-foreground'>{member.name_kFull}</div>
            <div className='text-sm text-muted-foreground'>{member.nameOfficial}</div>
          </div>
        </div>

        {canManageFinance ? <MemberDetailActions memberId={memberId} /> : null}
      </div>

      <DonationSelector
        memberId={memberId}
        taxYear={selectedYear}
        donations={donations}
        canGenerateReceipt={canManageFinance}
      />
    </main>
  )
}

export default ReceiptMemberPage;
