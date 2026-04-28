import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(req) {
  const token = req.cookies.get("admin_token")?.value;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      if (isLoginPage) return NextResponse.redirect(new URL("/", req.url));
    } catch (e) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

// On protège tout sauf l'API de login et les fichiers statiques
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};