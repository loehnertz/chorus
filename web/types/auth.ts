/**
 * Neon Auth TypeScript types
 * These types define the structure of session and user data from Neon Auth
 */

/**
 * Neon Auth user object
 * This matches the user data stored in the neon_auth schema
 */
export interface NeonAuthUser {
  id: string; // UUID
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Neon Auth session object
 * Returned by auth.getSession() and authClient.useSession()
 */
export interface NeonAuthSession {
  user: NeonAuthUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

/**
 * Session response from auth.getSession()
 */
export interface SessionResponse {
  data: NeonAuthSession | null;
  error?: {
    message: string;
    status: number;
  };
}
