import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'eathamozhi-coconut-farm-secure-jwt-secret-key-min-32-chars';
const JWT_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const ADMIN_WHITELISTED_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. If user is accessing the login page, check if already authenticated
  if (pathname === '/admin/login') {
    const token = req.cookies.get('admin_session')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_KEY);
        const email = (payload.email as string)?.trim().toLowerCase();
        if (
          payload.role === 'admin' &&
          ADMIN_WHITELISTED_EMAIL &&
          email === ADMIN_WHITELISTED_EMAIL
        ) {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      } catch {
        // Token invalid, allow login page to render
      }
    }
    return NextResponse.next();
  }

  // 2. Protect /admin routes (pages)
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_session')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_KEY);
      const email = (payload.email as string)?.trim().toLowerCase();
      if (
        payload.role !== 'admin' ||
        !ADMIN_WHITELISTED_EMAIL ||
        email !== ADMIN_WHITELISTED_EMAIL
      ) {
        const loginUrl = new URL('/admin/login', req.url);
        loginUrl.searchParams.set('error', 'unauthorized_email');
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect sensitive admin API endpoints
  if (pathname.startsWith('/api/admin/')) {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, JWT_KEY);
      const email = (payload.email as string)?.trim().toLowerCase();
      if (
        payload.role !== 'admin' ||
        !ADMIN_WHITELISTED_EMAIL ||
        email !== ADMIN_WHITELISTED_EMAIL
      ) {
        return NextResponse.json({ error: 'Forbidden. Unauthorized account.' }, { status: 403 });
      }
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Session expired or invalid.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
