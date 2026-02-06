/** @jest-environment node */

import { Frequency } from '@prisma/client'
import { POST } from '../route'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { getSuggestedChoreForSlot } from '@/lib/suggestions'

jest.mock('@/lib/auth/require-approval', () => ({
  requireApprovedUser: jest.fn(),
}))

jest.mock('@/lib/suggestions', () => ({
  getSuggestedChoreForSlot: jest.fn(),
}))

const mockRequireApprovedUser = requireApprovedUser as jest.Mock
const mockGetSuggestedChoreForSlot = getSuggestedChoreForSlot as jest.Mock

describe('/api/schedules/suggest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireApprovedUser.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('validates slotType', async () => {
    const response = await POST(
      new Request('http://localhost/api/schedules/suggest', {
        method: 'POST',
        body: JSON.stringify({ slotType: 'INVALID' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('slotType must be')
  })

  it('returns 404 when no suggestion is available', async () => {
    mockGetSuggestedChoreForSlot.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost/api/schedules/suggest', {
        method: 'POST',
        body: JSON.stringify({ slotType: Frequency.MONTHLY }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toContain('No compatible chores')
  })

  it('returns a suggestion payload', async () => {
    mockGetSuggestedChoreForSlot.mockResolvedValue({
      chore: { id: 'chore-1', title: 'Deep clean oven' },
      lastCompletedAt: null,
      assignedToUser: true,
    })

    const response = await POST(
      new Request('http://localhost/api/schedules/suggest', {
        method: 'POST',
        body: JSON.stringify({ slotType: Frequency.MONTHLY, userId: 'user-1' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.chore.id).toBe('chore-1')
    expect(body.data.assignedToUser).toBe(true)
    expect(mockGetSuggestedChoreForSlot).toHaveBeenCalledWith(Frequency.MONTHLY, 'user-1')
  })
})
