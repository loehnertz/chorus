/**
 * @jest-environment node
 */
jest.mock('@prisma/client', () => ({
  Frequency: {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
  },
}));

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUserApi: jest.fn(),
  isErrorResponse: jest.fn((r: unknown) => r instanceof Response),
}));

jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    choreAssignment: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { GET, PUT, DELETE } from '../route';
import { createMockSession } from '@/lib/__tests__/test-helpers';

import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(options?: { method?: string; body?: Record<string, unknown> }) {
  const init: RequestInit = { method: options?.method ?? 'GET' };
  if (options?.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new Request('http://localhost:3001/api/chores/test-id', init);
}

describe('GET /api/chores/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const response = await GET(makeRequest(), makeParams('test-id'));
    expect(response.status).toBe(401);
  });

  it('should return 404 when chore not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET(makeRequest(), makeParams('nonexistent'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Chore not found');
  });

  it('should return chore with assignments and completions', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const mockChore = {
      id: 'test-id',
      title: 'Dishes',
      frequency: 'DAILY',
      assignments: [],
      completions: [],
      _count: { completions: 5 },
    };
    (db.chore.findUnique as jest.Mock).mockResolvedValue(mockChore);

    const response = await GET(makeRequest(), makeParams('test-id'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockChore);

    expect(db.chore.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-id' },
        include: expect.objectContaining({
          completions: expect.objectContaining({ take: 5 }),
          _count: { select: { completions: true } },
        }),
      }),
    );
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const response = await GET(makeRequest(), makeParams('test-id'));
    expect(response.status).toBe(500);
  });
});

describe('PUT /api/chores/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = makeRequest({ method: 'PUT', body: { title: 'Updated' } });
    const response = await PUT(request, makeParams('test-id'));
    expect(response.status).toBe(401);
  });

  it('should return 404 when chore not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue(null);

    const request = makeRequest({ method: 'PUT', body: { title: 'Updated' } });
    const response = await PUT(request, makeParams('nonexistent'));
    expect(response.status).toBe(404);
  });

  it('should update chore title', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'test-id' });

    const updated = { id: 'test-id', title: 'Updated', assignments: [] };
    (db.chore.update as jest.Mock).mockResolvedValue(updated);

    const request = makeRequest({ method: 'PUT', body: { title: 'Updated' } });
    const response = await PUT(request, makeParams('test-id'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.title).toBe('Updated');
  });

  it('should return 400 for empty title', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = makeRequest({ method: 'PUT', body: { title: '' } });
    const response = await PUT(request, makeParams('test-id'));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('should return 400 for invalid frequency', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = makeRequest({ method: 'PUT', body: { frequency: 'INVALID' } });
    const response = await PUT(request, makeParams('test-id'));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('should use transaction when updating assigneeIds', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'test-id' });

    const updated = { id: 'test-id', title: 'Dishes', assignments: [] };
    (db.$transaction as jest.Mock).mockResolvedValue(updated);

    const request = makeRequest({
      method: 'PUT',
      body: { assigneeIds: ['user-1'] },
    });
    const response = await PUT(request, makeParams('test-id'));

    expect(response.status).toBe(200);
    expect(db.$transaction).toHaveBeenCalled();
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'test-id' });
    (db.chore.update as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest({ method: 'PUT', body: { title: 'Updated' } });
    const response = await PUT(request, makeParams('test-id'));

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/chores/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = makeRequest({ method: 'DELETE' });
    const response = await DELETE(request, makeParams('test-id'));
    expect(response.status).toBe(401);
  });

  it('should return 404 when chore not found', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue(null);

    const request = makeRequest({ method: 'DELETE' });
    const response = await DELETE(request, makeParams('nonexistent'));
    expect(response.status).toBe(404);
  });

  it('should delete chore and return 204', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'test-id' });
    (db.chore.delete as jest.Mock).mockResolvedValue({ id: 'test-id' });

    const request = makeRequest({ method: 'DELETE' });
    const response = await DELETE(request, makeParams('test-id'));

    expect(response.status).toBe(204);
    expect(db.chore.delete).toHaveBeenCalledWith({ where: { id: 'test-id' } });
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'test-id' });
    (db.chore.delete as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest({ method: 'DELETE' });
    const response = await DELETE(request, makeParams('test-id'));

    expect(response.status).toBe(500);
  });
});
