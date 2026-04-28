import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const token = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Autoriser l'accès à la page de login et aux ressources statiques
  if (pathname === '/login' || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 2. Si pas de token, direction le login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 3. Vérification du token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_temp');
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    // 4. Si le token est invalide (expiré ou faux), on vide le cookie et retour login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_token');
    return response;
  }
}

// Optionnel : on précise sur quelles routes le middleware doit s'activer
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};