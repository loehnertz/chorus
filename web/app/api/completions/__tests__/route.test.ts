/**
 * @jest-environment node
 */
jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUserApi: jest.fn(),
  isErrorResponse: jest.fn((r: unknown) => r instanceof Response),
}));

jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findUnique: jest.fn(),
    },
    schedule: {
      findUnique: jest.fn(),
    },
    choreCompletion: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { DELETE, GET, POST } from '../route';
import { createMockSession, createMockRequest } from '@/lib/__tests__/test-helpers';

import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

describe('POST /api/completions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it('should return 400 when choreId is missing', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: {},
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details.fieldErrors).toHaveProperty('choreId');
  });

  it('should return 404 when chore does not exist', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'nonexistent' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Chore not found');
  });

  it('should return 404 when schedule does not exist', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.schedule.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1', scheduleId: 'nonexistent' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Schedule not found');
  });

  it('should create completion successfully', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });

    const mockCompletion = {
      id: 'comp-1',
      choreId: 'chore-1',
      userId: 'test-user-id',
      chore: { id: 'chore-1', title: 'Dishes', frequency: 'DAILY' },
      user: { id: 'test-user-id', name: 'Test User', image: null },
    };
    (db.choreCompletion.create as jest.Mock).mockResolvedValue(mockCompletion);

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(mockCompletion);
    expect(db.choreCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          choreId: 'chore-1',
          userId: 'test-user-id',
        }),
      }),
    );
  });

  it('should create completion with schedule and notes', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({ id: 'sched-1', choreId: 'chore-1' });

    const mockCompletion = {
      id: 'comp-1',
      choreId: 'chore-1',
      scheduleId: 'sched-1',
      notes: 'Done well',
      userId: 'test-user-id',
      chore: { id: 'chore-1', title: 'Dishes', frequency: 'DAILY' },
      user: { id: 'test-user-id', name: 'Test User', image: null },
    };
    (db.choreCompletion.create as jest.Mock).mockResolvedValue(mockCompletion);

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1', scheduleId: 'sched-1', notes: '  Done well  ' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(201);
    expect(db.choreCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scheduleId: 'sched-1',
          notes: 'Done well',
        }),
      }),
    );
  });

  it('should be idempotent when completing a schedule twice', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({ id: 'sched-1', choreId: 'chore-1' });

    const existing = {
      id: 'comp-1',
      choreId: 'chore-1',
      scheduleId: 'sched-1',
      notes: null,
      userId: 'test-user-id',
      chore: { id: 'chore-1', title: 'Dishes', frequency: 'DAILY' },
      user: { id: 'test-user-id', name: 'Test User', image: null },
    };
    (db.choreCompletion.findUnique as jest.Mock).mockResolvedValue(existing);

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1', scheduleId: 'sched-1' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(existing);
    expect(db.choreCompletion.create).not.toHaveBeenCalled();
  });

  it('should be idempotent when schedule already completed by another user', async () => {
    const session = createMockSession({ userId: 'u1' });
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.schedule.findUnique as jest.Mock).mockResolvedValue({ id: 'sched-1', choreId: 'chore-1' });

    const existing = {
      id: 'comp-1',
      choreId: 'chore-1',
      scheduleId: 'sched-1',
      notes: null,
      userId: 'u2',
      chore: { id: 'chore-1', title: 'Dishes', frequency: 'DAILY' },
      user: { id: 'u2', name: 'Other User', image: null },
    };
    (db.choreCompletion.findUnique as jest.Mock).mockResolvedValue(existing);

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1', scheduleId: 'sched-1' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(existing);
    expect(db.choreCompletion.create).not.toHaveBeenCalled();
  });

  it('should use custom completedAt if provided', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.choreCompletion.create as jest.Mock).mockResolvedValue({ id: 'comp-1' });

    const completedAt = '2024-06-15T10:00:00Z';
    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1', completedAt },
    });
    await POST(request as never);

    expect(db.choreCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completedAt: new Date(completedAt),
        }),
      }),
    );
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'chore-1' });
    (db.choreCompletion.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/completions', {
      method: 'POST',
      body: { choreId: 'chore-1' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(500);
  });
});

describe('GET /api/completions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/completions');
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it('should return paginated completions', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const mockCompletions = [
      { id: 'comp-1', choreId: 'chore-1' },
      { id: 'comp-2', choreId: 'chore-2' },
    ];
    (db.choreCompletion.findMany as jest.Mock).mockResolvedValue(mockCompletions);
    (db.choreCompletion.count as jest.Mock).mockResolvedValue(2);

    const request = createMockRequest('/api/completions');
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      completions: mockCompletions,
      total: 2,
      limit: 50,
      offset: 0,
    });
  });

  it('should filter by choreId', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (db.choreCompletion.count as jest.Mock).mockResolvedValue(0);

    const request = createMockRequest('/api/completions', {
      searchParams: { choreId: 'chore-1' },
    });
    await GET(request as never);

    expect(db.choreCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ choreId: 'chore-1' }),
      }),
    );
  });

  it('should filter by userId', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (db.choreCompletion.count as jest.Mock).mockResolvedValue(0);

    const request = createMockRequest('/api/completions', {
      searchParams: { userId: 'user-1' },
    });
    await GET(request as never);

    expect(db.choreCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      }),
    );
  });

  it('should filter by date range', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (db.choreCompletion.count as jest.Mock).mockResolvedValue(0);

    const request = createMockRequest('/api/completions', {
      searchParams: {
        from: '2024-01-01',
        to: '2024-12-31',
      },
    });
    await GET(request as never);

    expect(db.choreCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completedAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        }),
      }),
    );
  });

  it('should respect limit and offset params', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (db.choreCompletion.count as jest.Mock).mockResolvedValue(0);

    const request = createMockRequest('/api/completions', {
      searchParams: { limit: '10', offset: '20' },
    });
    const response = await GET(request as never);

    const body = await response.json();
    expect(body.limit).toBe(10);
    expect(body.offset).toBe(20);
    expect(db.choreCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      }),
    );
  });

  it('should cap limit at 100', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (db.choreCompletion.count as jest.Mock).mockResolvedValue(0);

    const request = createMockRequest('/api/completions', {
      searchParams: { limit: '200' },
    });
    const response = await GET(request as never);

    const body = await response.json();
    expect(body.limit).toBe(100);
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.choreCompletion.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/completions');
    const response = await GET(request as never);

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/completions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/completions?scheduleId=s1', {
      method: 'DELETE',
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(401);
  });

  it('should return 400 when scheduleId is missing', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/completions', {
      method: 'DELETE',
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('scheduleId is required');
  });

  it('should delete the current user completion for scheduleId', async () => {
    const session = createMockSession({ userId: 'u1' });
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    ;(db.choreCompletion.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    const request = createMockRequest('/api/completions?scheduleId=s1', {
      method: 'DELETE',
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(204);
    expect(db.choreCompletion.deleteMany).toHaveBeenCalledWith({
      where: {
        scheduleId: 's1',
        userId: 'u1',
      },
    });
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    ;(db.choreCompletion.deleteMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/completions?scheduleId=s1', {
      method: 'DELETE',
    });
    const response = await DELETE(request as never);

    expect(response.status).toBe(500);
  });
});
