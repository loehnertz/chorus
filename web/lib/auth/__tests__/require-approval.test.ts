/**
 * @jest-environment node
 */
import { requireApprovedUserApi, isErrorResponse } from '../require-approval';
import { createMockSession } from '@/lib/__tests__/test-helpers';

jest.mock('../server', () => ({
  auth: { getSession: jest.fn() },
}));

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../user-sync', () => ({
  syncUser: jest.fn(),
}));

import { auth } from '../server';
import { db } from '@/lib/db';

describe('requireApprovedUserApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when no session exists', async () => {
    (auth.getSession as jest.Mock).mockResolvedValue({ data: null });

    const result = await requireApprovedUserApi();

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 401 when session has no user', async () => {
    (auth.getSession as jest.Mock).mockResolvedValue({ data: { user: null } });

    const result = await requireApprovedUserApi();

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it('should return 403 when user is not approved', async () => {
    const session = createMockSession();
    (auth.getSession as jest.Mock).mockResolvedValue({ data: session });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ approved: false });

    const result = await requireApprovedUserApi();

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('User not approved');
  });

  it('should return 403 when user not found in db', async () => {
    const session = createMockSession();
    (auth.getSession as jest.Mock).mockResolvedValue({ data: session });
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await requireApprovedUserApi();

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it('should return session when user is authenticated and approved', async () => {
    const session = createMockSession();
    (auth.getSession as jest.Mock).mockResolvedValue({ data: session });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ approved: true });

    const result = await requireApprovedUserApi();

    expect(result).not.toBeInstanceOf(Response);
    expect(result).toEqual(session);
  });
});

describe('isErrorResponse', () => {
  it('should return true for a Response', () => {
    const response = new Response('error', { status: 401 });
    expect(isErrorResponse(response)).toBe(true);
  });

  it('should return false for a session object', () => {
    const session = createMockSession();
    expect(isErrorResponse(session)).toBe(false);
  });
});
