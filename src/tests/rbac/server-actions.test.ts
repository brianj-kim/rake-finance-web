import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '@/app/lib/rbac';

const mocked = vi.hoisted(() => ({
  canAccess: vi.fn(),
}));

vi.mock('@/app/lib/auth', () => ({
  canAccess: mocked.canAccess,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/app/lib/prisma', () => ({
  prisma: {},
}));

vi.mock('@/app/ui/receipt/receipt-document', () => ({
  default: () => null,
}));

vi.mock('@/app/lib/pdf/buffer-from-react-pdf', () => ({
  bufferFromReactPdf: vi.fn(),
}));

type ActionCase = {
  name: string;
  run: () => Promise<unknown>;
  permission: string;
};

const cases: ActionCase[] = [
  {
    name: 'income saveBatchIncome',
    run: async () =>
      (await import('@/app/lib/data')).saveBatchIncome({
        year: 2026,
        month: 1,
        day: 1,
        entries: [],
      }),
    permission: PERMISSIONS.INCOME_CREATE,
  },
  {
    name: 'income updateIncome',
    run: async () => (await import('@/app/lib/data')).updateIncome({}),
    permission: PERMISSIONS.INCOME_UPDATE,
  },
  {
    name: 'income deleteIncome',
    run: async () => (await import('@/app/lib/data')).deleteIncome(1),
    permission: PERMISSIONS.INCOME_DELETE,
  },
  {
    name: 'member getMemberForEdit',
    run: async () => (await import('@/app/lib/member-actions')).getMemberForEdit(1),
    permission: PERMISSIONS.MEMBER_READ,
  },
  {
    name: 'member createMember',
    run: async () => (await import('@/app/lib/member-actions')).createMember({}),
    permission: PERMISSIONS.MEMBER_CREATE,
  },
  {
    name: 'member updateMember',
    run: async () => (await import('@/app/lib/member-actions')).updateMember({}),
    permission: PERMISSIONS.MEMBER_UPDATE,
  },
  {
    name: 'member deleteMember',
    run: async () => (await import('@/app/lib/member-actions')).deleteMember(1),
    permission: PERMISSIONS.MEMBER_DELETE,
  },
  {
    name: 'receipt generateAnnualReceipt',
    run: async () => (await import('@/app/lib/receipt-actions')).generateAnnualReceipt({ memberId: 1, taxYear: 2025 }),
    permission: PERMISSIONS.RECEIPT_GENERATE,
  },
  {
    name: 'receipt generateReceiptsForYearBatch',
    run: async () => (await import('@/app/lib/receipt-actions')).generateReceiptsForYearBatch({ taxYear: 2025 }),
    permission: PERMISSIONS.RECEIPT_GENERATE,
  },
  {
    name: 'receipt deleteReceiptAndFile',
    run: async () => (await import('@/app/lib/receipt-actions')).deleteReceiptAndFile({ receiptId: 'r1' }),
    permission: PERMISSIONS.RECEIPT_DELETE,
  },
  {
    name: 'receipt deleteReceiptsAndFiles',
    run: async () => (await import('@/app/lib/receipt-actions')).deleteReceiptsAndFiles({ receiptIds: ['r1'] }),
    permission: PERMISSIONS.RECEIPT_DELETE,
  },
];

describe('RBAC server action guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.canAccess.mockResolvedValue(false);
  });

  it.each(cases)('returns Forbidden when access denied: $name', async ({ run, permission }) => {
    const result = (await run()) as { success: boolean; message: string };

    expect(result).toEqual({ success: false, message: 'Forbidden' });
    expect(mocked.canAccess).toHaveBeenCalledWith(permission);
  });
});
