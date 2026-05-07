import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "faralaes_session";

const privatePrefixes = [
  "/mis-anuncios",
  "/perfil",
  "/mensajes",
  "/favoritos",
  "/publicar",
  "/editar",
  "/admin",
];

const getAuthSecret = () =>
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "faralaes-dev-secret";

const base64UrlToBytes = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const verifySessionCookie = async (token: string) => {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(`${header}.${payload}`)
  );

  if (!isValidSignature) {
    return false;
  }

  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      exp?: number;
      userId?: string;
    };

    return Boolean(
      session.userId &&
        typeof session.exp === "number" &&
        session.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPrivateRoute = privatePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isPrivateRoute) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasSession = sessionCookie ? await verifySessionCookie(sessionCookie) : false;

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/mis-anuncios/:path*",
    "/perfil/:path*",
    "/mensajes/:path*",
    "/favoritos/:path*",
    "/publicar/:path*",
    "/editar/:path*",
    "/admin/:path*",
  ],
};
