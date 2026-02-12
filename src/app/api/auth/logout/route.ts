import { NextResponse } from 'next/server';

const COOKIE_NAME = 'session';

export const POST = async () => {
  const res = NextResponse.json({ ok: true });

  // Clear cookie reliably:
  // - maxAge: 0 expires it
  // - path must match how it was set (usually "/")
  // - sameSite/secure should match your login cookie settings
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res;
}