import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { signSession } from '@/app/lib/auth';

export const POST = async (req: Request) => {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: 'Missiong credentials'}, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await bcrypt.compare(String(password), admin.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await signSession({
    sub: String(admin.id),
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return res;
}