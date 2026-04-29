import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    const { pathname } = request.nextUrl;

    // Routes publiques
    if (pathname === '/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || "temp_secret_123";
      const secret = new TextEncoder().encode(jwtSecret);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (e) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('admin_token');
      return res;
    }
  } catch (error) {
    // Fallback si crash du middleware
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};