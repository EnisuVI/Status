import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req) {
  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD_HASH) {
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m") // Déconnexion automatique après 15 min
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const response = NextResponse.json({ message: "OK" });
    response.cookies.set("admin_token", token, {
      httpOnly: true, // Sécurité : invisible pour le JavaScript malveillant
      secure: true,
      sameSite: "strict",
      maxAge: 900, // 15 minutes en secondes
    });
    return response;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}