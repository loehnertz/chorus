import { Frequency } from '@prisma/client'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { getSuggestedChoreForSlot } from '@/lib/suggestions'

interface SuggestPayload {
  slotType?: unknown
  userId?: unknown
}

function isFrequency(value: string): value is Frequency {
  return value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY' || value === 'YEARLY'
}

export async function POST(request: Request) {
  await requireApprovedUser()

  let payload: SuggestPayload
  try {
    payload = (await request.json()) as SuggestPayload
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const slotType = typeof payload.slotType === 'string' ? payload.slotType : ''
  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : ''

  if (!isFrequency(slotType)) {
    return Response.json({ error: 'slotType must be DAILY, WEEKLY, MONTHLY, or YEARLY' }, { status: 400 })
  }

  const suggestion = await getSuggestedChoreForSlot(slotType, userId || undefined)
  if (!suggestion) {
    return Response.json({ error: 'No compatible chores available for this slot type' }, { status: 404 })
  }

  return Response.json({
    data: {
      slotType,
      chore: suggestion.chore,
      lastCompletedAt: suggestion.lastCompletedAt,
      assignedToUser: suggestion.assignedToUser,
    },
  })
}
