import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] ${request.method} ${pathname}`);

  if (pathname === '/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname === '/favicon.png') {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Vérification JWT manuelle sans import externe
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('invalid');
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('admin_token');
      return res;
    }
    
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('admin_token');
    return res;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.png|login).*)'],
};