import { Frequency } from '@prisma/client'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { getSuggestedChoreForSlot, isChoreCompatibleWithSlot } from '@/lib/suggestions'

interface CreateSchedulePayload {
  scheduledFor?: unknown
  slotType?: unknown
  choreId?: unknown
  suggested?: unknown
  userId?: unknown
}

function isFrequency(value: string): value is Frequency {
  return value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY' || value === 'YEARLY'
}

export async function GET(request: Request) {
  await requireApprovedUser()

  const { searchParams } = new URL(request.url)

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const slotType = searchParams.get('slotType')
  const userId = searchParams.get('userId')
  const limitRaw = searchParams.get('limit')

  const where: {
    slotType?: Frequency
    scheduledFor?: {
      gte?: Date
      lte?: Date
    }
    chore?: {
      assignments: {
        some: {
          userId: string
        }
      }
    }
  } = {}

  if (slotType) {
    if (!isFrequency(slotType)) {
      return Response.json({ error: 'Invalid slotType' }, { status: 400 })
    }
    where.slotType = slotType
  }

  if (from || to) {
    where.scheduledFor = {}

    if (from) {
      const fromDate = new Date(from)
      if (Number.isNaN(fromDate.getTime())) {
        return Response.json({ error: 'Invalid from date' }, { status: 400 })
      }
      where.scheduledFor.gte = fromDate
    }

    if (to) {
      const toDate = new Date(to)
      if (Number.isNaN(toDate.getTime())) {
        return Response.json({ error: 'Invalid to date' }, { status: 400 })
      }
      where.scheduledFor.lte = toDate
    }
  }

  if (userId) {
    where.chore = {
      assignments: {
        some: {
          userId,
        },
      },
    }
  }

  const limit = limitRaw ? Number(limitRaw) : 100
  if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
    return Response.json({ error: 'limit must be an integer between 1 and 500' }, { status: 400 })
  }

  const schedules = await db.schedule.findMany({
    where,
    take: limit,
    orderBy: {
      scheduledFor: 'asc',
    },
    include: {
      chore: {
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      completions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  return Response.json({ data: schedules })
}

export async function POST(request: Request) {
  await requireApprovedUser()

  let payload: CreateSchedulePayload
  try {
    payload = (await request.json()) as CreateSchedulePayload
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const scheduledForRaw = typeof payload.scheduledFor === 'string' ? payload.scheduledFor : ''
  const slotTypeRaw = typeof payload.slotType === 'string' ? payload.slotType : ''
  const choreId = typeof payload.choreId === 'string' ? payload.choreId.trim() : ''
  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : ''

  if (!scheduledForRaw) {
    return Response.json({ error: 'scheduledFor is required' }, { status: 400 })
  }

  const scheduledFor = new Date(scheduledForRaw)
  if (Number.isNaN(scheduledFor.getTime())) {
    return Response.json({ error: 'scheduledFor must be a valid date' }, { status: 400 })
  }

  if (!isFrequency(slotTypeRaw)) {
    return Response.json({ error: 'slotType must be DAILY, WEEKLY, MONTHLY, or YEARLY' }, { status: 400 })
  }

  let finalChoreId = choreId
  let suggested = false

  if (!finalChoreId) {
    const suggestion = await getSuggestedChoreForSlot(slotTypeRaw, userId || undefined)
    if (!suggestion) {
      return Response.json({ error: 'No compatible chore found for this slot' }, { status: 404 })
    }

    finalChoreId = suggestion.chore.id
    suggested = true
  } else {
    const chore = await db.chore.findUnique({
      where: { id: finalChoreId },
      select: { id: true, frequency: true },
    })

    if (!chore) {
      return Response.json({ error: 'Chore not found' }, { status: 404 })
    }

    if (!isChoreCompatibleWithSlot(chore.frequency, slotTypeRaw)) {
      return Response.json({ error: 'Chore frequency is not compatible with this slot type' }, { status: 400 })
    }

    suggested = payload.suggested === true
  }

  const schedule = await db.schedule.create({
    data: {
      choreId: finalChoreId,
      slotType: slotTypeRaw,
      scheduledFor,
      suggested,
    },
    include: {
      chore: {
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      completions: true,
    },
  })

  return Response.json({ data: schedule }, { status: 201 })
}
