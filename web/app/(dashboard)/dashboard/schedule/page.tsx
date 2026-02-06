import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'
import { ScheduleWorkspace } from '@/components/schedule-workspace'

export default async function SchedulePage() {
  await requireApprovedUser()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [schedules, chores] = await Promise.all([
    db.schedule.findMany({
      where: {
        scheduledFor: {
          gte: today,
        },
      },
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
            _count: {
              select: {
                completions: true,
                schedules: true,
              },
            },
          },
        },
      },
    }),
    db.chore.findMany({
      orderBy: [{ frequency: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        frequency: true,
      },
    }),
  ])

  return <ScheduleWorkspace initialSchedules={schedules} availableChores={chores} />
}

export const dynamic = 'force-dynamic'
