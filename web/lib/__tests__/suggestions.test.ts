/** @jest-environment node */

import { Frequency } from '@prisma/client'
import {
  getCompatibleFrequencies,
  getSuggestedChoreForSlot,
  isChoreCompatibleWithSlot,
  isSlotTypeSupported,
} from '../suggestions'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findMany: jest.fn(),
    },
  },
}))

type MockDb = {
  chore: {
    findMany: jest.Mock
  }
}

const mockDb = db as unknown as MockDb

describe('suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns slot compatibility rules', () => {
    expect(getCompatibleFrequencies(Frequency.WEEKLY)).toEqual([Frequency.DAILY, Frequency.MONTHLY])
    expect(getCompatibleFrequencies(Frequency.MONTHLY)).toEqual([Frequency.YEARLY])
    expect(getCompatibleFrequencies(Frequency.YEARLY)).toEqual([])
  })

  it('checks supported slot types and compatibility', () => {
    expect(isSlotTypeSupported(Frequency.WEEKLY)).toBe(true)
    expect(isSlotTypeSupported(Frequency.YEARLY)).toBe(false)
    expect(isChoreCompatibleWithSlot(Frequency.DAILY, Frequency.WEEKLY)).toBe(true)
    expect(isChoreCompatibleWithSlot(Frequency.YEARLY, Frequency.WEEKLY)).toBe(false)
  })

  it('prioritizes never-completed chores', async () => {
    mockDb.chore.findMany.mockResolvedValue([
      {
        id: 'chore-1',
        title: 'Old completed chore',
        frequency: Frequency.DAILY,
        assignments: [],
        completions: [{ completedAt: new Date('2025-01-01T00:00:00.000Z') }],
      },
      {
        id: 'chore-2',
        title: 'Never completed chore',
        frequency: Frequency.DAILY,
        assignments: [],
        completions: [],
      },
    ])

    const suggestion = await getSuggestedChoreForSlot(Frequency.WEEKLY)

    expect(suggestion?.chore.id).toBe('chore-2')
    expect(suggestion?.lastCompletedAt).toBeNull()
  })

  it('falls back to least-recently completed when all have history', async () => {
    mockDb.chore.findMany.mockResolvedValue([
      {
        id: 'chore-1',
        title: 'Recently completed',
        frequency: Frequency.DAILY,
        assignments: [],
        completions: [{ completedAt: new Date('2025-01-05T00:00:00.000Z') }],
      },
      {
        id: 'chore-2',
        title: 'Least recently completed',
        frequency: Frequency.DAILY,
        assignments: [],
        completions: [{ completedAt: new Date('2025-01-02T00:00:00.000Z') }],
      },
    ])

    const suggestion = await getSuggestedChoreForSlot(Frequency.WEEKLY)

    expect(suggestion?.chore.id).toBe('chore-2')
  })

  it('uses assignment matching as tiebreaker for same completion age', async () => {
    const completionDate = new Date('2025-01-02T00:00:00.000Z')

    mockDb.chore.findMany.mockResolvedValue([
      {
        id: 'chore-1',
        title: 'Unassigned',
        frequency: Frequency.DAILY,
        assignments: [],
        completions: [{ completedAt: completionDate }],
      },
      {
        id: 'chore-2',
        title: 'Assigned',
        frequency: Frequency.DAILY,
        assignments: [{ userId: 'user-1' }],
        completions: [{ completedAt: completionDate }],
      },
    ])

    const suggestion = await getSuggestedChoreForSlot(Frequency.WEEKLY, 'user-1')

    expect(suggestion?.chore.id).toBe('chore-2')
    expect(suggestion?.assignedToUser).toBe(true)
  })

  it('returns null for unsupported slot types or empty pools', async () => {
    const yearlySuggestion = await getSuggestedChoreForSlot(Frequency.YEARLY)
    expect(yearlySuggestion).toBeNull()

    mockDb.chore.findMany.mockResolvedValue([])
    const noChoreSuggestion = await getSuggestedChoreForSlot(Frequency.MONTHLY)
    expect(noChoreSuggestion).toBeNull()
  })
})
