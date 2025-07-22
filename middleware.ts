import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Debug logging for WebVM routes
  if (nextUrl.pathname.startsWith('/workspace') || nextUrl.pathname.startsWith('/ai-workspace')) {
    console.log(`🔍 WebVM Route Access: ${nextUrl.pathname}`);
    console.log(`- User Agent: ${req.headers.get('user-agent')?.substring(0, 50)}...`);
    console.log(`- Referer: ${req.headers.get('referer') || 'none'}`);
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  const isPublicRoute = nextUrl.pathname === "/" ||
                        nextUrl.pathname.startsWith("/blog") ||
                        nextUrl.pathname.startsWith("/pricing") ||
                        nextUrl.pathname.startsWith("/about") ||
                        nextUrl.pathname.startsWith("/docs") ||
                        nextUrl.hash === "#demo";

  if (isApiAuthRoute) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/login", nextUrl));
  }

  return;
});

// Optionally, don't invoke middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};