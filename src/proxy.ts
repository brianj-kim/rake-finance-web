import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/app/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export const proxy = async (req: NextRequest) => {
  const { pathname, searchParams } = req.nextUrl;

  // allow next internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  // allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get('session')?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname + (searchParams.toString() ? `${searchParams}` : ''));

    return NextResponse.redirect(url);
  }

  try {
    await verifySession(token);

    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);

    return NextResponse.redirect(url);
  }
}

export const config = {
  mathcer: [
    /*
      Everything except:
      - next static
      - favicon
      - login route itself
      - auth API
    */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};