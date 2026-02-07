import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';
import {
  createScheduleSchema,
  formatValidationError,
  listSchedulesQuerySchema,
} from '@/lib/validations';
import { startOfTodayUtc, startOfTomorrowUtc } from '@/lib/date';

export const GET = withApproval(async (_session, request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = {
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      frequency: searchParams.get('frequency') ?? undefined,
    };

    const parsed = listSchedulesQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { from, to, frequency } = parsed.data;

    const fromIsDateOnly = typeof rawQuery.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawQuery.from);
    const toIsDateOnly = typeof rawQuery.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawQuery.to);

    const schedules = await db.schedule.findMany({
      where: {
        hidden: false,
        ...(frequency && { slotType: frequency }),
        ...(from || to
          ? {
              scheduledFor: {
                ...(from && { gte: fromIsDateOnly ? startOfTodayUtc(from) : from }),
                ...(to && (toIsDateOnly ? { lt: startOfTomorrowUtc(to) } : { lte: to })),
              },
            }
          : {}),
      },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    return Response.json(schedules);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApproval(async (_session, request: Request) => {
  try {
    const body = await request.json();
    const parsed = createScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { choreId, scheduledFor, slotType, suggested } = parsed.data;

    // Idempotency: if this chore is already scheduled for this exact datetime,
    // return the existing record (and optionally update metadata).
    const existing = await db.schedule.findFirst({
      where: { choreId, scheduledFor },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
          },
        },
      },
    });

    if (existing) {
      const nextSuggested = existing.suggested && suggested;
      const nextHidden = false;
      const needsUpdate =
        existing.slotType !== slotType ||
        existing.suggested !== nextSuggested ||
        // Allow "re-adding" hidden schedules.
        existing.hidden === true;

      if (!needsUpdate) {
        return Response.json(existing, { status: 200 });
      }

      const updated = await db.schedule.update({
        where: { id: existing.id },
        data: {
          slotType,
          suggested: nextSuggested,
          hidden: nextHidden,
        },
        include: {
          chore: {
            select: {
              id: true,
              title: true,
              description: true,
              frequency: true,
            },
          },
        },
      });

      return Response.json(updated, { status: 200 });
    }

    const chore = await db.chore.findUnique({ where: { id: choreId } });
    if (!chore) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    const schedule = await db.schedule.create({
      data: {
        choreId,
        scheduledFor,
        slotType,
        suggested,
      },
      include: {
        chore: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
          },
        },
      },
    });

    return Response.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
