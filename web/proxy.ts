import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

/**
 * Next.js Proxy (Route Protection)
 * Checks authentication with Neon Auth
 *
 * Note: User approval checking is done at the application level (dashboard layout)
 * because proxy runs on edge runtime which doesn't support Prisma database queries
 *
 * All routes are protected by default except:
 * - The login URL (/sign-in)
 * - Auth API routes (/api/auth/*)
 * - Public pages (/, /pending-approval, /sign-up)
 */
export default neonAuthMiddleware({
  loginUrl: '/sign-in',
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
