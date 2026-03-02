import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/app/lib/auth';
import { PERMISSIONS } from '@/app/lib/rbac';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const loginRedirect = (req: NextRequest) =>{
  const url = req.nextUrl.clone();
  url.pathname = '/login';

  const next = 
    req.nextUrl.pathname +
    (req.nextUrl.searchParams.toString() ? `?${req.nextUrl.searchParams.toString()}` : '');

  url.searchParams.set('next', next);

  return NextResponse.redirect(url);
};

export const proxy = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // allow next internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  // allow public paths
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get('session')?.value;
  if (!token) return loginRedirect(req);

  try {
    const session = await verifySession(token);

    if (
      pathname.startsWith('/admin') &&
      !session.permissionCodes.includes(PERMISSIONS.ADMIN_ACCESS)
    ) {
      const url = req.nextUrl.clone();
      url.pathname = '/income';
      url.search = '';

      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    return loginRedirect(req);
  }
}

export const config = {
  matcher: [    
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
