/**
 * @jest-environment node
 */
jest.mock('@prisma/client', () => ({
  Frequency: {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    BIWEEKLY: 'BIWEEKLY',
    MONTHLY: 'MONTHLY',
    BIMONTHLY: 'BIMONTHLY',
    SEMIANNUAL: 'SEMIANNUAL',
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
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { GET, POST } from '../route';
import { createMockSession, createMockRequest } from '@/lib/__tests__/test-helpers';

import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

describe('GET /api/chores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/chores');
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it('should return 403 when not approved', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'User not approved' }, { status: 403 }),
    );

    const request = createMockRequest('/api/chores');
    const response = await GET(request as never);

    expect(response.status).toBe(403);
  });

  it('should return all chores', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const mockChores = [
      { id: '1', title: 'Dishes', frequency: 'DAILY', assignments: [] },
      { id: '2', title: 'Vacuum', frequency: 'WEEKLY', assignments: [] },
    ];
    (db.chore.findMany as jest.Mock).mockResolvedValue(mockChores);

    const request = createMockRequest('/api/chores');
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockChores);
    expect(db.chore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('should filter by frequency', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/chores', {
      searchParams: { frequency: 'DAILY' },
    });
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    expect(db.chore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ frequency: 'DAILY' }),
      }),
    );
  });

  it('should filter by search term', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/chores', {
      searchParams: { search: 'dishes' },
    });
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    expect(db.chore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'dishes', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('should return 400 for invalid frequency', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/chores', {
      searchParams: { frequency: 'INVALID' },
    });
    const response = await GET(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid frequency');
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/chores');
    const response = await GET(request as never);

    expect(response.status).toBe(500);
  });
});

describe('POST /api/chores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: 'Test', frequency: 'DAILY' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(401);
  });

  it('should create a chore successfully', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const mockChore = {
      id: 'new-id',
      title: 'Dishes',
      frequency: 'DAILY',
      description: null,
      assignments: [],
    };
    (db.chore.create as jest.Mock).mockResolvedValue(mockChore);

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: 'Dishes', frequency: 'DAILY' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(mockChore);
  });

  it('should create a chore with assignees', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const mockChore = {
      id: 'new-id',
      title: 'Dishes',
      frequency: 'DAILY',
      assignments: [{ userId: 'user-1', user: { id: 'user-1', name: 'Alice', image: null } }],
    };
    (db.chore.create as jest.Mock).mockResolvedValue(mockChore);

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: 'Dishes', frequency: 'DAILY', assigneeIds: ['user-1'] },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(201);
    expect(db.chore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assignments: {
            create: [{ userId: 'user-1' }],
          },
        }),
      }),
    );
  });

  it('should return 400 when title is missing', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { frequency: 'DAILY' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details.fieldErrors).toHaveProperty('title');
  });

  it('should return 400 when title is empty string', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: '  ', frequency: 'DAILY' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it('should return 400 when frequency is invalid', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: 'Dishes', frequency: 'HOURLY' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('should return 400 when assigneeIds is not an array', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: 'Dishes', frequency: 'DAILY', assigneeIds: 'not-array' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details.fieldErrors).toHaveProperty('assigneeIds');
  });

  it('should return 500 on database error', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: 'Dishes', frequency: 'DAILY' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(500);
  });

  it('should trim title and description', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.create as jest.Mock).mockResolvedValue({
      id: 'new-id',
      title: 'Dishes',
      description: 'Clean them',
      assignments: [],
    });

    const request = createMockRequest('/api/chores', {
      method: 'POST',
      body: { title: '  Dishes  ', frequency: 'DAILY', description: '  Clean them  ' },
    });
    await POST(request as never);

    expect(db.chore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Dishes',
          description: 'Clean them',
        }),
      }),
    );
  });
});
