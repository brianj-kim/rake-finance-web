import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { signSession } from '@/app/lib/auth';
import { isRoleCode } from '@/app/lib/rbac';

export const POST = async (req: Request) => {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      isActive: true,
      adminRoles: {
        select: {
          role: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  });

  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await bcrypt.compare(String(password), admin.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const roleCodesFromDb = admin.adminRoles.map((r) => r.role.code);
  const roleCodes = [...new Set(roleCodesFromDb.length > 0 ? roleCodesFromDb : [admin.role])].filter(
    isRoleCode
  );

  const token = await signSession({
    sub: String(admin.id),
    email: admin.email,
    name: admin.name,
    roleCodes,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return res;
};
