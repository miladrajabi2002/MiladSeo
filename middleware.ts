export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect all pages except /login, the public /share dashboard
     * and Next.js internals. API routes are excluded here because
     * every handler enforces auth itself and returns a proper 401
     * JSON body instead of a redirect to the sign-in page
     * (/api/share/[token] is intentionally public — the unguessable
     * token is the credential).
     */
    "/((?!login|share|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
