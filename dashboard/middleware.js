import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// On définit le secret à l'extérieur pour plus de clarté
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_dont_use_in_production";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('admin_token')?.value;

  // 1. Laisser passer les fichiers statiques et la page de login
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Si pas de token, on redirige vers le login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 3. Vérification du token avec jose (compatible Edge)
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    // 4. Token invalide -> retour au login
    console.error("Middleware Auth Error:", err.message);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_token');
    return response;
  }
}

// Sécurité supplémentaire : on ne surveille pas les fichiers système
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};