import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => {
  const prisma = {
    income: { findUnique: vi.fn() },
    member: { findUnique: vi.fn() },
    receipt: { findMany: vi.fn() },
  };

  return {
    requireFinanceAccess: vi.fn(),
    requireSuperAdmin: vi.fn(),
    canAccessFinance: vi.fn(),
    fetchFilteredIncome: vi.fn(),
    getIncomeMethods: vi.fn(),
    getIncomeTypes: vi.fn(),
    fetchFilteredMembers: vi.fn(),
    getIncomeKpis: vi.fn(),
    getMonthlyTotals: vi.fn(),
    getQuarterlyTotals: vi.fn(),
    getTypeBreakdown: vi.fn(),
    getMethodBreakdown: vi.fn(),
    getReceiptStats: vi.fn(),
    getReceiptMemberMenu: vi.fn(),
    getMemberDonationsForYear: vi.fn(),
    getReceiptMemberInfo: vi.fn(),
    fetchReceipts: vi.fn(),
    listCategories: vi.fn(),
    getCharityProfile: vi.fn(),
    prisma,
  };
});

vi.mock('@/app/lib/auth', () => ({
  requireFinanceAccess: mocked.requireFinanceAccess,
  requireSuperAdmin: mocked.requireSuperAdmin,
  canAccessFinance: mocked.canAccessFinance,
}));

vi.mock('@/app/lib/data', () => ({
  fetchFilteredIncome: mocked.fetchFilteredIncome,
  getIncomeMethods: mocked.getIncomeMethods,
  getIncomeTypes: mocked.getIncomeTypes,
  fetchFilteredMembers: mocked.fetchFilteredMembers,
  getIncomeKpis: mocked.getIncomeKpis,
  getMonthlyTotals: mocked.getMonthlyTotals,
  getQuarterlyTotals: mocked.getQuarterlyTotals,
  getTypeBreakdown: mocked.getTypeBreakdown,
  getMethodBreakdown: mocked.getMethodBreakdown,
}));

vi.mock('@/app/lib/receipt-data', () => ({
  getReceiptStats: mocked.getReceiptStats,
  getReceiptMemberMenu: mocked.getReceiptMemberMenu,
  getMemberDonationsForYear: mocked.getMemberDonationsForYear,
  getReceiptMemberInfo: mocked.getReceiptMemberInfo,
}));

vi.mock('@/app/lib/receipt-manage-data', () => ({
  fetchReceipts: mocked.fetchReceipts,
}));

vi.mock('@/app/lib/admin-actions', () => ({
  listCategories: mocked.listCategories,
  getCharityProfile: mocked.getCharityProfile,
}));

vi.mock('@/app/lib/prisma', () => ({
  prisma: mocked.prisma,
}));

vi.mock('next/link', () => ({
  default: () => null,
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

type PageCase = {
  name: string;
  modulePath: string;
  run: (module: { default: (props?: unknown) => Promise<unknown> }) => Promise<unknown>;
  guard: 'finance' | 'super';
  nextPath: string;
};

const cases: PageCase[] = [
  {
    name: 'income dashboard',
    modulePath: '@/app/income/page',
    run: (module) => module.default({ searchParams: Promise.resolve({}) }),
    guard: 'finance',
    nextPath: '/income',
  },
  {
    name: 'income list',
    modulePath: '@/app/income/list/page',
    run: (module) => module.default({ searchParams: Promise.resolve({}) }),
    guard: 'finance',
    nextPath: '/income/list',
  },
  {
    name: 'income create',
    modulePath: '@/app/income/list/create/page',
    run: (module) => module.default(),
    guard: 'finance',
    nextPath: '/income/list/create',
  },
  {
    name: 'income edit',
    modulePath: '@/app/income/list/[id]/edit/page',
    run: (module) => module.default({ params: { id: '1' } }),
    guard: 'finance',
    nextPath: '/income/list',
  },
  {
    name: 'member list',
    modulePath: '@/app/income/member/page',
    run: (module) => module.default({ searchParams: Promise.resolve({}) }),
    guard: 'finance',
    nextPath: '/income/member',
  },
  {
    name: 'member create',
    modulePath: '@/app/income/member/create/page',
    run: (module) => module.default(),
    guard: 'finance',
    nextPath: '/income/member/create',
  },
  {
    name: 'member receipts',
    modulePath: '@/app/income/member/[id]/receipts/page',
    run: (module) => module.default({ params: Promise.resolve({ id: '1' }) }),
    guard: 'finance',
    nextPath: '/income/member',
  },
  {
    name: 'receipt landing',
    modulePath: '@/app/income/receipt/page',
    run: (module) => module.default({ searchParams: Promise.resolve({}) }),
    guard: 'finance',
    nextPath: '/income/receipt',
  },
  {
    name: 'receipt member detail',
    modulePath: '@/app/income/receipt/[memberId]/page',
    run: (module) =>
      module.default({
        params: Promise.resolve({ memberId: '1' }),
        searchParams: Promise.resolve({}),
      }),
    guard: 'finance',
    nextPath: '/income/receipt',
  },
  {
    name: 'receipt manage',
    modulePath: '@/app/income/receipt/manage/page',
    run: (module) => module.default({ searchParams: Promise.resolve({}) }),
    guard: 'finance',
    nextPath: '/income/receipt/manage',
  },
  {
    name: 'admin dashboard',
    modulePath: '@/app/admin/page',
    run: (module) => module.default(),
    guard: 'super',
    nextPath: '/admin',
  },
  {
    name: 'admin charity',
    modulePath: '@/app/admin/charity/page',
    run: (module) => module.default(),
    guard: 'super',
    nextPath: '/admin/charity',
  },
  {
    name: 'admin category',
    modulePath: '@/app/admin/category/page',
    run: (module) => module.default(),
    guard: 'super',
    nextPath: '/admin/category',
  },
];

describe('RBAC page guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocked.requireFinanceAccess.mockResolvedValue(undefined);
    mocked.requireSuperAdmin.mockResolvedValue(undefined);
    mocked.canAccessFinance.mockResolvedValue(true);

    mocked.fetchFilteredIncome.mockResolvedValue({ data: [], pagination: { totalPages: 1 } });
    mocked.getIncomeMethods.mockResolvedValue([]);
    mocked.getIncomeTypes.mockResolvedValue([]);
    mocked.fetchFilteredMembers.mockResolvedValue({ data: [], pagination: { totalPages: 1 } });
    mocked.getIncomeKpis.mockResolvedValue({
      yearTotalCents: 0,
      monthTotalCents: 0,
      donationCount: 0,
      uniqueDonors: 0,
    });
    mocked.getMonthlyTotals.mockResolvedValue([]);
    mocked.getQuarterlyTotals.mockResolvedValue([]);
    mocked.getTypeBreakdown.mockResolvedValue([]);
    mocked.getMethodBreakdown.mockResolvedValue([]);
    mocked.getReceiptStats.mockResolvedValue({
      receiptCount: 0,
      totalIssuedCents: 0,
      generatedAtISO: null,
    });
    mocked.getReceiptMemberMenu.mockResolvedValue({ items: [], totalPages: 1 });
    mocked.getMemberDonationsForYear.mockResolvedValue([]);
    mocked.getReceiptMemberInfo.mockResolvedValue({
      memberId: 1,
      name_kFull: 'Test Member',
      nameOfficial: 'Test Member',
    });
    mocked.fetchReceipts.mockResolvedValue({ data: [], pagination: { totalPages: 1 } });
    mocked.listCategories.mockResolvedValue([]);
    mocked.getCharityProfile.mockResolvedValue({
      legalName: '',
      address: '',
      city: '',
      province: '',
      postal: '',
      registrationNo: '',
      locationIssued: '',
      authorizedSigner: '',
      charityEmail: '',
      charityPhone: '',
      charityWebsite: '',
      churchLogoUrl: '',
      authorizedSignature: '',
    });

    mocked.prisma.income.findUnique.mockResolvedValue({
      inc_id: 1,
      amount: 1000,
      inc_type: 1,
      inc_method: 1,
      notes: '',
      year: 2026,
      month: 1,
      day: 1,
      Member: { name_kFull: 'Test Member', mbr_id: 1 },
    });
    mocked.prisma.member.findUnique.mockResolvedValue({
      mbr_id: 1,
      name_kFull: 'Test Member',
      name_eFirst: 'Test',
      name_eLast: 'Member',
      address: null,
      city: null,
      province: null,
      postal: null,
      email: null,
    });
    mocked.prisma.receipt.findMany.mockResolvedValue([]);
  });

  it.each(cases)('requires correct guard for $name', async ({ modulePath, run, guard, nextPath }) => {
    const pageModule = await import(modulePath);
    await run(pageModule as { default: (props?: unknown) => Promise<unknown> });

    if (guard === 'finance') {
      expect(mocked.requireFinanceAccess).toHaveBeenCalledWith({ nextPath });
      return;
    }

    expect(mocked.requireSuperAdmin).toHaveBeenCalledWith({ nextPath });
  });
});
