/**
 * @jest-environment node
 */
jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUserApi: jest.fn(),
  isErrorResponse: jest.fn((r: unknown) => r instanceof Response),
}));

jest.mock('@/lib/db', () => ({
  db: {
    chore: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    choreAssignment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { POST } from '../route';
import { DELETE } from '../[userId]/route';
import { createMockSession } from '@/lib/__tests__/test-helpers';
import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeParamsWithUser(id: string, userId: string) {
  return { params: Promise.resolve({ id, userId }) };
}

function makeRequest(options?: { method?: string; body?: Record<string, unknown> }) {
  const init: RequestInit = { method: options?.method ?? 'POST' };
  if (options?.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new Request('http://localhost:3001/api/chores/test-id/assignments', init);
}

describe('POST /api/chores/[id]/assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = makeRequest({ body: { userId: 'user-1' } });
    const response = await POST(request, makeParams('chore-1'));
    expect(response.status).toBe(401);
  });

  it('should return 400 when userId is missing', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = makeRequest({ body: {} });
    const response = await POST(request, makeParams('chore-1'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('should return 404 when chore not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue(null);

    const request = makeRequest({ body: { userId: 'user-1' } });
    const response = await POST(request, makeParams('nonexistent'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Chore not found');
  });

  it('should return 404 when user not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = makeRequest({ body: { userId: 'nonexistent' } });
    const response = await POST(request, makeParams('chore-1'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('should return 409 when assignment already exists', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (db.choreAssignment.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

    const request = makeRequest({ body: { userId: 'user-1' } });
    const response = await POST(request, makeParams('chore-1'));
    expect(response.status).toBe(409);
  });

  it('should create assignment successfully', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (db.choreAssignment.findUnique as jest.Mock).mockResolvedValue(null);

    const mockAssignment = {
      id: 'assign-1',
      userId: 'user-1',
      choreId: 'chore-1',
      user: { id: 'user-1', name: 'Alice', image: null },
      chore: { id: 'chore-1', title: 'Dishes', frequency: 'DAILY' },
    };
    (db.choreAssignment.create as jest.Mock).mockResolvedValue(mockAssignment);

    const request = makeRequest({ body: { userId: 'user-1' } });
    const response = await POST(request, makeParams('chore-1'));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(mockAssignment);
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest({ body: { userId: 'user-1' } });
    const response = await POST(request, makeParams('chore-1'));
    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/chores/[id]/assignments/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = new Request('http://localhost:3001', { method: 'DELETE' });
    const response = await DELETE(request, makeParamsWithUser('chore-1', 'user-1'));
    expect(response.status).toBe(401);
  });

  it('should return 404 when assignment not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreAssignment.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3001', { method: 'DELETE' });
    const response = await DELETE(request, makeParamsWithUser('chore-1', 'user-1'));
    expect(response.status).toBe(404);
  });

  it('should delete assignment and return 204', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreAssignment.findUnique as jest.Mock).mockResolvedValue({ id: 'assign-1' });
    (db.choreAssignment.delete as jest.Mock).mockResolvedValue({ id: 'assign-1' });

    const request = new Request('http://localhost:3001', { method: 'DELETE' });
    const response = await DELETE(request, makeParamsWithUser('chore-1', 'user-1'));

    expect(response.status).toBe(204);
    expect(db.choreAssignment.delete).toHaveBeenCalledWith({
      where: { userId_choreId: { userId: 'user-1', choreId: 'chore-1' } },
    });
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreAssignment.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = new Request('http://localhost:3001', { method: 'DELETE' });
    const response = await DELETE(request, makeParamsWithUser('chore-1', 'user-1'));
    expect(response.status).toBe(500);
  });
});
