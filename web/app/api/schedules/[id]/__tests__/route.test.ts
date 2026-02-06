/** @jest-environment node */

import { Prisma } from '@prisma/client'
import { DELETE } from '../route'
import { db } from '@/lib/db'
import { requireApprovedUser } from '@/lib/auth/require-approval'

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    schedule: {
      delete: jest.fn(),
    },
  },
}))

type MockDb = {
  schedule: {
    delete: jest.Mock
  }
}

const mockDb = db as unknown as MockDb
const mockRequireApprovedUser = requireApprovedUser as jest.Mock

describe('/api/schedules/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('deletes schedule', async () => {
    mockDb.schedule.delete.mockResolvedValue({ id: 'schedule-1' })

    const response = await DELETE(new Request('http://localhost/api/schedules/schedule-1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'schedule-1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 404 when schedule does not exist', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '7.3.0',
    })
    mockDb.schedule.delete.mockRejectedValue(prismaError)

    const response = await DELETE(new Request('http://localhost/api/schedules/missing', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'missing' }),
    })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toContain('not found')
  })
})
