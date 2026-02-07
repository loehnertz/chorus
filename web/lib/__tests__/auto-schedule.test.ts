jest.mock('@/lib/db', () => ({
  db: {
    chore: {
      findMany: jest.fn(),
    },
    schedule: {
      createMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { ensureDailySchedules } from '../auto-schedule'

describe('ensureDailySchedules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create schedules for all daily chores', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'chore-1' },
      { id: 'chore-2' },
      { id: 'chore-3' },
    ])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 3 })

    const result = await ensureDailySchedules(new Date('2026-02-07T14:30:00Z'))

    expect(result).toEqual({ created: 3 })

    expect(db.chore.findMany).toHaveBeenCalledWith({
      where: { frequency: 'DAILY' },
      select: { id: true },
    })

    expect(db.schedule.createMany).toHaveBeenCalledWith({
      data: [
        { choreId: 'chore-1', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
        { choreId: 'chore-2', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
        { choreId: 'chore-3', scheduledFor: new Date('2026-02-07T00:00:00Z'), slotType: 'DAILY', suggested: false },
      ],
      skipDuplicates: true,
    })
  })

  it('should return count less than total when some schedules already exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([
      { id: 'chore-1' },
      { id: 'chore-2' },
    ])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await ensureDailySchedules(new Date('2026-02-07T10:00:00Z'))

    expect(result).toEqual({ created: 1 })
    expect(db.schedule.createMany).toHaveBeenCalled()
  })

  it('should return zero and skip createMany when no daily chores exist', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([])

    const result = await ensureDailySchedules(new Date('2026-02-07T10:00:00Z'))

    expect(result).toEqual({ created: 0 })
    expect(db.schedule.createMany).not.toHaveBeenCalled()
  })

  it('should use start-of-day UTC regardless of input time', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    await ensureDailySchedules(new Date('2026-02-07T23:59:59Z'))

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data[0].scheduledFor).toEqual(new Date('2026-02-07T00:00:00Z'))
  })

  it('should set suggested to false and slotType to DAILY', async () => {
    ;(db.chore.findMany as jest.Mock).mockResolvedValue([{ id: 'chore-1' }])
    ;(db.schedule.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    await ensureDailySchedules(new Date('2026-02-07T12:00:00Z'))

    const data = (db.schedule.createMany as jest.Mock).mock.calls[0][0].data
    expect(data[0].suggested).toBe(false)
    expect(data[0].slotType).toBe('DAILY')
  })
})
