export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect all pages except /login and Next.js internals.
     * API routes are excluded here because every handler enforces
     * auth itself and returns a proper 401 JSON body instead of a
     * redirect to the sign-in page.
     */
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
