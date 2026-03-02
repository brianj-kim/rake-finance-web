import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PermissionCode } from '@/app/lib/rbac';
import { ALL_PERMISSION_CODES } from '@/app/lib/rbac';

export const SESSION_COOKIE_NAME = 'session';
const SESSION_TTL = '7d';

export type SessionPayload = {
  sub: string;
  email: string;
  name?: string | null;
  roleCodes: string[];
  permissionCodes: PermissionCode[];
};

const isStringArray = (v:unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === 'string');

const isPermissionCode = (v: unknown): v is PermissionCode =>
  typeof v === 'string' && (ALL_PERMISSION_CODES as readonly string[]).includes(v);

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
  const permissionCodesRaw = (payload as { permissionCodes?: unknown }).permissionCodes;

  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid Session Payload');
  }

  if (!isStringArray(roleCodesRaw) || !isStringArray(permissionCodesRaw)) {
    throw new Error('Inalid Session Payload');
  }

  const roleCodes = [...new Set(roleCodesRaw.map((r) => r.trim()).filter(Boolean))];
  const permissionCodes = [
    ...new Set(permissionCodesRaw.filter((p): p is PermissionCode => isPermissionCode(p))),
  ];

  return {
    sub,
    email,
    name: typeof name === 'string' ? name: null,
    roleCodes,
    permissionCodes,
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

export const hasPermission = (
  session: SessionPayload | null,
  permission: PermissionCode
) => Boolean(session && session.permissionCodes.includes(permission));

export const hasAnyPermission = (
  session: SessionPayload | null,
  permissions: readonly PermissionCode[]
) => Boolean(session && permissions.some((p) => session.permissionCodes.includes(p)));

export const canAccess = async (permission: PermissionCode) => {
  const session = await getSession();

  return hasPermission(session, permission);
}

export const requirePermission = async (
  permission: PermissionCode,
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

  if (!session.permissionCodes.includes(permission)) {
    redirect(options?.unauthorizedRedirectTo ?? '/');
  }

  return session;
};

export const isSignedIn = async () => {
  return Boolean(await getSession());
};
