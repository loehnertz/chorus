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
    schedule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    chore: {
      findUnique: jest.fn(),
    },
  },
}));

import { GET, POST } from '../route';
import { createMockRequest, createMockSession } from '@/lib/__tests__/test-helpers';

import { requireApprovedUserApi } from '@/lib/auth/require-approval';
import { db } from '@/lib/db';

describe('GET /api/schedules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/schedules');
    const response = await GET(request as never);

    expect(response.status).toBe(401);
  });

  it('should return schedules', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const mock = [{ id: 's1', scheduledFor: '2026-02-01T00:00:00Z', slotType: 'DAILY' }];
    (db.schedule.findMany as jest.Mock).mockResolvedValue(mock);

    const request = createMockRequest('/api/schedules');
    const response = await GET(request as never);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mock);
    expect(db.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { scheduledFor: 'asc' } }),
    );
  });

  it('should return 400 for invalid frequency', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/schedules', {
      searchParams: { frequency: 'INVALID' },
    });
    const response = await GET(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('should return 400 for invalid date range', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/schedules', {
      searchParams: { from: '2026-02-01', to: '2026-01-01' },
    });
    const response = await GET(request as never);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/schedules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const request = createMockRequest('/api/schedules', {
      method: 'POST',
      body: { choreId: 'c1', scheduledFor: '2026-02-01T00:00:00Z', slotType: 'DAILY' },
    });
    const response = await POST(request as never);
    expect(response.status).toBe(401);
  });

  it('should return 400 for missing fields', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const request = createMockRequest('/api/schedules', {
      method: 'POST',
      body: { choreId: 'c1' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('should return 404 when chore does not exist', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.chore.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('/api/schedules', {
      method: 'POST',
      body: { choreId: 'missing', scheduledFor: '2026-02-01T00:00:00Z', slotType: 'DAILY' },
    });
    const response = await POST(request as never);
    expect(response.status).toBe(404);
  });

  it('should create schedule successfully', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);
    (db.schedule.findFirst as jest.Mock).mockResolvedValue(null);
    (db.chore.findUnique as jest.Mock).mockResolvedValue({ id: 'c1' });

    const created = { id: 's1', choreId: 'c1', slotType: 'DAILY', suggested: true };
    (db.schedule.create as jest.Mock).mockResolvedValue(created);

    const request = createMockRequest('/api/schedules', {
      method: 'POST',
      body: { choreId: 'c1', scheduledFor: '2026-02-01T00:00:00Z', slotType: 'DAILY' },
    });
    const response = await POST(request as never);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(created);
  });

  it('should be idempotent when already scheduled', async () => {
    const session = createMockSession();
    (requireApprovedUserApi as jest.Mock).mockResolvedValue(session);

    const existing = {
      id: 's1',
      choreId: 'c1',
      scheduledFor: '2026-02-01T00:00:00.000Z',
      slotType: 'DAILY',
      suggested: true,
      chore: { id: 'c1', title: 'Dishes', description: null, frequency: 'DAILY' },
    };
    (db.schedule.findFirst as jest.Mock).mockResolvedValue(existing);

    const request = createMockRequest('/api/schedules', {
      method: 'POST',
      body: { choreId: 'c1', scheduledFor: '2026-02-01T00:00:00Z', slotType: 'DAILY' },
    });
    const response = await POST(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(existing);
    expect(db.schedule.create).not.toHaveBeenCalled();
  });
});
