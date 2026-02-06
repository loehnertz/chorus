import type { NeonAuthSession } from '@/types/auth';

/**
 * Creates a mock NeonAuthSession with sensible defaults
 */
export function createMockSession(overrides?: Partial<{
  userId: string;
  email: string;
  name: string;
  image: string | null;
}>): NeonAuthSession {
  const userId = overrides?.userId ?? 'test-user-id';
  return {
    user: {
      id: userId,
      email: overrides?.email ?? 'test@example.com',
      name: overrides?.name ?? 'Test User',
      image: overrides?.image ?? null,
      emailVerified: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    session: {
      id: 'test-session-id',
      userId,
      expiresAt: new Date(Date.now() + 86400000),
      token: 'test-token',
    },
  };
}

/**
 * Creates a mock Request object for testing route handlers
 */
export function createMockRequest(
  path: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    searchParams?: Record<string, string>;
  },
): Request {
  const url = new URL(path, 'http://localhost:3001');
  if (options?.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const init: RequestInit = {
    method: options?.method ?? 'GET',
  };

  if (options?.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { 'Content-Type': 'application/json' };
  }

  return new Request(url.toString(), init);
}
