export const runtime = 'experimental-edge'; // Force l'environnement Edge
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export const runtime = 'experimental-edge';

export async function middleware(request) {
  const token = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "temp_secret_123");
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (e) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('admin_token');
    return res;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};