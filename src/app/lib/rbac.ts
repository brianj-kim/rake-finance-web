export const ROLE_CODES = {
  SUPER: 'super',
  TREASURER: 'treasurer',
  PASTOR: 'pastor',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
export const ALL_ROLE_CODES = Object.values(ROLE_CODES) as RoleCode[];
const ROLE_CODE_SET = new Set<string>(ALL_ROLE_CODES);

export const isRoleCode = (value: unknown): value is RoleCode =>
  typeof value === 'string' && ROLE_CODE_SET.has(value);

export const ADMIN_ROLE_CODES = [ROLE_CODES.SUPER] as const satisfies readonly RoleCode[];
export const FINANCE_ROLE_CODES = [
  ROLE_CODES.SUPER,
  ROLE_CODES.TREASURER,
] as const satisfies readonly RoleCode[];
