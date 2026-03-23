import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  canAccessFinance: vi.fn(),
}));

vi.mock('@/app/lib/auth', () => ({
  canAccessFinance: mocked.canAccessFinance,
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
  },
  {
    name: 'income updateIncome',
    run: async () => (await import('@/app/lib/data')).updateIncome({}),
  },
  {
    name: 'income deleteIncome',
    run: async () => (await import('@/app/lib/data')).deleteIncome(1),
  },
  {
    name: 'member getMemberForEdit',
    run: async () => (await import('@/app/lib/member-actions')).getMemberForEdit(1),
  },
  {
    name: 'member createMember',
    run: async () => (await import('@/app/lib/member-actions')).createMember({}),
  },
  {
    name: 'member updateMember',
    run: async () => (await import('@/app/lib/member-actions')).updateMember({}),
  },
  {
    name: 'member deleteMember',
    run: async () => (await import('@/app/lib/member-actions')).deleteMember(1),
  },
  {
    name: 'receipt generateAnnualReceipt',
    run: async () => (await import('@/app/lib/receipt-actions')).generateAnnualReceipt({ memberId: 1, taxYear: 2025 }),
  },
  {
    name: 'receipt generateReceiptsForYearBatch',
    run: async () => (await import('@/app/lib/receipt-actions')).generateReceiptsForYearBatch({ taxYear: 2025 }),
  },
  {
    name: 'receipt deleteReceiptAndFile',
    run: async () => (await import('@/app/lib/receipt-actions')).deleteReceiptAndFile({ receiptId: 'r1' }),
  },
  {
    name: 'receipt deleteReceiptsAndFiles',
    run: async () => (await import('@/app/lib/receipt-actions')).deleteReceiptsAndFiles({ receiptIds: ['r1'] }),
  },
];

describe('RBAC server action guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.canAccessFinance.mockResolvedValue(false);
  });

  it.each(cases)('returns Forbidden when access denied: $name', async ({ run }) => {
    const result = (await run()) as { success: boolean; message: string };

    expect(result).toEqual({ success: false, message: 'Forbidden' });
    expect(mocked.canAccessFinance).toHaveBeenCalled();
  });
});
