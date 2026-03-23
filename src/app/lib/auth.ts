import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { RoleCode } from '@/app/lib/rbac';
import {
  ADMIN_ROLE_CODES,
  FINANCE_ROLE_CODES,
  isRoleCode,
  ROLE_CODES,
} from '@/app/lib/rbac';

export const SESSION_COOKIE_NAME = 'session';
const SESSION_TTL = '7d';

export type SessionPayload = {
  sub: string;
  email: string;
  name?: string | null;
  roleCodes: RoleCode[];
};

const isStringArray = (v:unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === 'string');

const getSecret = () => {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(raw);
};

export const signSession = async (payload: SessionPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
};

export const verifySession = async (token: string): Promise<SessionPayload> => {
  const { payload } = await jwtVerify(token, getSecret());

  const sub = payload.sub;
  const email = (payload as { email?: unknown }).email;
  const name = (payload as { name?: unknown }).name;
  const roleCodesRaw = (payload as { roleCodes?: unknown }).roleCodes;

  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid Session Payload');
  }

  if (!isStringArray(roleCodesRaw)) {
    throw new Error('Invalid Session Payload');
  }

  const roleCodes = [
    ...new Set(roleCodesRaw.map((roleCode) => roleCode.trim()).filter(isRoleCode)),
  ];

  return {
    sub,
    email,
    name: typeof name === 'string' ? name : null,
    roleCodes,
  };  
};

export const getSession = async (): Promise<SessionPayload | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
};

export const hasRole = (session: SessionPayload | null, roleCode: RoleCode) =>
  Boolean(session && session.roleCodes.includes(roleCode));

export const hasAnyRole = (session: SessionPayload | null, roleCodes: readonly RoleCode[]) =>
  Boolean(session && roleCodes.some((roleCode) => session.roleCodes.includes(roleCode)));

export const isSuperAdmin = (session: SessionPayload | null) =>
  hasRole(session, ROLE_CODES.SUPER);

export const canAccessRole = async (roleCode: RoleCode) => {
  const session = await getSession();
  return hasRole(session, roleCode);
};

export const canAccessAnyRole = async (roleCodes: readonly RoleCode[]) => {
  const session = await getSession();
  return hasAnyRole(session, roleCodes);
};

export const canAccessFinance = async () => canAccessAnyRole(FINANCE_ROLE_CODES);

export const canAccessAdmin = async () => canAccessAnyRole(ADMIN_ROLE_CODES);

export const requireAnyRole = async (
  roleCodes: readonly RoleCode[],
  options?: {
    nextPath?: string;
    unauthorizedRedirectTo?: string;
  }
) => {
  const session = await getSession();
  if (!session) {
    if (options?.nextPath) redirect(`/login?next=${encodeURIComponent(options.nextPath)}`);
    redirect('/login');
  }

  if (!hasAnyRole(session, roleCodes)) {
    redirect(options?.unauthorizedRedirectTo ?? '/');
  }

  return session;
};

export const requireRole = async (
  roleCode: RoleCode,
  options?: {
    nextPath?: string;
    unauthorizedRedirectTo?: string;
  }
) => {
  const session = await getSession();
  if (!session) {
    if (options?.nextPath) redirect(`/login?next=${encodeURIComponent(options.nextPath)}`);
    redirect('/login');
  }

  if (!session.roleCodes.includes(roleCode)) {
    redirect(options?.unauthorizedRedirectTo ?? '/');
  }

  return session;
};

export const requireFinanceAccess = async (options?: {
  nextPath?: string;
  unauthorizedRedirectTo?: string;
}) => requireAnyRole(FINANCE_ROLE_CODES, options);

export const requireAdminAccess = async (options?: {
  nextPath?: string;
  unauthorizedRedirectTo?: string;
}) => requireAnyRole(ADMIN_ROLE_CODES, options);

export const requireSuperAdmin = async (options?: {
  nextPath?: string;
  unauthorizedRedirectTo?: string;
}) => requireAdminAccess(options);

export const isSignedIn = async () => {
  return Boolean(await getSession());
};
