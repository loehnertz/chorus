import { Frequency, Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const SLOT_COMPATIBILITY: Record<Frequency, Frequency[]> = {
  DAILY: [],
  WEEKLY: [Frequency.DAILY, Frequency.MONTHLY],
  MONTHLY: [Frequency.YEARLY],
  YEARLY: [],
}

export interface SuggestedChoreResult {
  chore: Prisma.ChoreGetPayload<{
    include: {
      assignments: {
        select: {
          userId: true
        }
      }
      completions: {
        select: {
          completedAt: true
        }
      }
    }
  }>
  lastCompletedAt: Date | null
  assignedToUser: boolean
}

export function getCompatibleFrequencies(slotType: Frequency): Frequency[] {
  return SLOT_COMPATIBILITY[slotType]
}

export function isSlotTypeSupported(slotType: Frequency): boolean {
  return getCompatibleFrequencies(slotType).length > 0
}

export function isChoreCompatibleWithSlot(choreFrequency: Frequency, slotType: Frequency): boolean {
  return getCompatibleFrequencies(slotType).includes(choreFrequency)
}

export async function getSuggestedChoreForSlot(
  slotType: Frequency,
  userId?: string | null
): Promise<SuggestedChoreResult | null> {
  if (!isSlotTypeSupported(slotType)) {
    return null
  }

  const compatibleFrequencies = getCompatibleFrequencies(slotType)

  const chores = await db.chore.findMany({
    where: {
      frequency: {
        in: compatibleFrequencies,
      },
    },
    include: {
      assignments: {
        select: {
          userId: true,
        },
      },
      completions: {
        select: {
          completedAt: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 1,
      },
    },
  })

  if (chores.length === 0) {
    return null
  }

  const rankedChores: SuggestedChoreResult[] = chores.map((chore) => {
    const lastCompletedAt = chore.completions[0]?.completedAt ?? null
    const assignedToUser = userId ? chore.assignments.some((assignment) => assignment.userId === userId) : false

    return {
      chore,
      lastCompletedAt,
      assignedToUser,
    }
  })

  rankedChores.sort((left, right) => {
    const leftNeverCompleted = left.lastCompletedAt === null
    const rightNeverCompleted = right.lastCompletedAt === null

    if (leftNeverCompleted !== rightNeverCompleted) {
      return leftNeverCompleted ? -1 : 1
    }

    if (left.lastCompletedAt && right.lastCompletedAt) {
      const completionDifference = left.lastCompletedAt.getTime() - right.lastCompletedAt.getTime()
      if (completionDifference !== 0) {
        return completionDifference
      }
    }

    if (userId && left.assignedToUser !== right.assignedToUser) {
      return left.assignedToUser ? -1 : 1
    }

    return left.chore.title.localeCompare(right.chore.title)
  })

  return rankedChores[0] ?? null
}
