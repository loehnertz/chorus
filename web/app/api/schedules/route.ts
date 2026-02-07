import { db } from '@/lib/db';
import { requireApprovedUserApi, isErrorResponse } from '@/lib/auth/require-approval';
import {
  createScheduleSchema,
  formatValidationError,
  listSchedulesQuerySchema,
} from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

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

    const schedules = await db.schedule.findMany({
      where: {
        ...(frequency && { slotType: frequency }),
        ...(from || to
          ? {
              scheduledFor: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
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
}

export async function POST(request: Request) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

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
      const needsUpdate = existing.slotType !== slotType || existing.suggested !== nextSuggested;

      if (!needsUpdate) {
        return Response.json(existing, { status: 200 });
      }

      const updated = await db.schedule.update({
        where: { id: existing.id },
        data: {
          slotType,
          suggested: nextSuggested,
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
}
