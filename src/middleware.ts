import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware only needs to read the session cookie, so it uses the edge-safe
// config — pulling in `@/auth` would drag Prisma and bcrypt into the bundle.
const { auth } = NextAuth(authConfig);

const PROTECTED = ["/dashboard", "/mission"];
const AUTH_PAGES = ["/login", "/register"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user);

  if (!signedIn && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return Response.redirect(url);
  }

  if (signedIn && AUTH_PAGES.includes(pathname)) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  // Everything except API routes (they do their own auth checks), Next internals,
  // and the PWA files that must be fetchable without a session.
  matcher: [
    "/((?!api/|_next/static|_next/image|icons/|uploads/|sw.js|manifest.webmanifest|favicon.ico).*)",
  ],
};
