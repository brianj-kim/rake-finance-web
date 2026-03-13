export const ROLE_CODES = {
  SUPER: 'super',
  TREASURER: 'treasurer',
  PASTOR: 'pastor',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin.access',
  ADMIN_MANAGE_ADMINS: 'admin.manage_admins',
  ADMIN_MANAGE_CHARITY: 'admin.manage_charity',
  ADMIN_MANAGE_CATEGORIES: 'admin.manage_categories',

  INCOME_READ: 'income.read',
  INCOME_CREATE: 'income.create',
  INCOME_UPDATE: 'income.update',
  INCOME_DELETE: 'income.delete',

  MEMBER_READ: 'member.read',
  MEMBER_CREATE: 'member.create',
  MEMBER_UPDATE: 'member.update',
  MEMBER_DELETE: 'member.delete',

  RECEIPT_READ: 'receipt.read',
  RECEIPT_GENERATE: 'receipt.generate',
  RECEIPT_UPDATE: 'receipt.update',
  RECEIPT_DELETE: 'receipt.delete',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSION_CODES = Object.values(PERMISSIONS) as PermissionCode[];
const PERMISSION_CODE_SET = new Set<string>(ALL_PERMISSION_CODES);

export const isPermissionCode = (value: unknown): value is PermissionCode =>
  typeof value === 'string' && PERMISSION_CODE_SET.has(value);

const TREASURER_PERMISSION_CODES: PermissionCode[] = [
  PERMISSIONS.INCOME_READ,
  PERMISSIONS.INCOME_CREATE,
  PERMISSIONS.INCOME_UPDATE,
  PERMISSIONS.INCOME_DELETE,
  PERMISSIONS.MEMBER_READ,
  PERMISSIONS.MEMBER_CREATE,
  PERMISSIONS.MEMBER_UPDATE,
  PERMISSIONS.MEMBER_DELETE,
  PERMISSIONS.RECEIPT_READ,
  PERMISSIONS.RECEIPT_GENERATE,
  PERMISSIONS.RECEIPT_DELETE,
];

export const ROLE_PERMISSION_BOOTSTRAP: Record<RoleCode, PermissionCode[]> = {
  [ROLE_CODES.SUPER]: [...ALL_PERMISSION_CODES],
  [ROLE_CODES.TREASURER]: TREASURER_PERMISSION_CODES,
  [ROLE_CODES.PASTOR]: [],
};
