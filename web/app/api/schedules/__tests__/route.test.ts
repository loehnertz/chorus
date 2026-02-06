/** @jest-environment node */

import { Frequency } from '@prisma/client'
import { GET, POST } from '../route'
import { db } from '@/lib/db'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { getSuggestedChoreForSlot, isChoreCompatibleWithSlot } from '@/lib/suggestions'

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUser: jest.fn(),
}))

jest.mock('@/lib/suggestions', () => ({
  getSuggestedChoreForSlot: jest.fn(),
  isChoreCompatibleWithSlot: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    schedule: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    chore: {
      findUnique: jest.fn(),
    },
  },
}))

type MockDb = {
  schedule: {
    findMany: jest.Mock
    create: jest.Mock
  }
  chore: {
    findUnique: jest.Mock
  }
}

const mockDb = db as unknown as MockDb
const mockRequireApprovedUser = requireApprovedUser as jest.Mock
const mockGetSuggestedChoreForSlot = getSuggestedChoreForSlot as jest.Mock
const mockIsChoreCompatibleWithSlot = isChoreCompatibleWithSlot as jest.Mock

describe('/api/schedules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue({ user: { id: 'user-1' } })
    mockIsChoreCompatibleWithSlot.mockReturnValue(true)
  })

  it('GET validates from date', async () => {
    const response = await GET(new Request('http://localhost/api/schedules?from=invalid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Invalid from date')
  })

  it('GET returns schedules', async () => {
    mockDb.schedule.findMany.mockResolvedValue([
      {
        id: 'schedule-1',
        choreId: 'chore-1',
        slotType: Frequency.WEEKLY,
        scheduledFor: new Date('2025-01-10T00:00:00.000Z'),
      },
    ])

    const response = await GET(new Request('http://localhost/api/schedules?slotType=WEEKLY&limit=5'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(mockDb.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slotType: Frequency.WEEKLY }),
        take: 5,
      })
    )
  })

  it('POST validates required fields', async () => {
    const response = await POST(
      new Request('http://localhost/api/schedules', {
        method: 'POST',
        body: JSON.stringify({ slotType: Frequency.WEEKLY }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('scheduledFor is required')
  })

  it('POST creates schedule from suggestion when no choreId is provided', async () => {
    mockGetSuggestedChoreForSlot.mockResolvedValue({
      chore: { id: 'chore-1' },
      lastCompletedAt: null,
      assignedToUser: false,
    })
    mockDb.schedule.create.mockResolvedValue({
      id: 'schedule-1',
      choreId: 'chore-1',
      slotType: Frequency.WEEKLY,
      suggested: true,
    })

    const response = await POST(
      new Request('http://localhost/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          scheduledFor: '2025-01-10T00:00:00.000Z',
          slotType: Frequency.WEEKLY,
        }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.suggested).toBe(true)
    expect(mockGetSuggestedChoreForSlot).toHaveBeenCalledWith(Frequency.WEEKLY, undefined)
  })

  it('POST validates manual chore compatibility', async () => {
    mockDb.chore.findUnique.mockResolvedValue({ id: 'chore-1', frequency: Frequency.YEARLY })
    mockIsChoreCompatibleWithSlot.mockReturnValue(false)

    const response = await POST(
      new Request('http://localhost/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          scheduledFor: '2025-01-10T00:00:00.000Z',
          slotType: Frequency.WEEKLY,
          choreId: 'chore-1',
        }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('not compatible')
  })

  it('POST creates schedule with provided choreId', async () => {
    mockDb.chore.findUnique.mockResolvedValue({ id: 'chore-1', frequency: Frequency.DAILY })
    mockDb.schedule.create.mockResolvedValue({
      id: 'schedule-1',
      choreId: 'chore-1',
      slotType: Frequency.WEEKLY,
      suggested: false,
    })

    const response = await POST(
      new Request('http://localhost/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          scheduledFor: '2025-01-10T00:00:00.000Z',
          slotType: Frequency.WEEKLY,
          choreId: 'chore-1',
          suggested: false,
        }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.choreId).toBe('chore-1')
    expect(mockDb.schedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          choreId: 'chore-1',
          suggested: false,
        }),
      })
    )
  })
})
