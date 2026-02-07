import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';
import {
  createCompletionSchema,
  formatValidationError,
  listCompletionsQuerySchema,
} from '@/lib/validations';
import { startOfTodayUtc, startOfTomorrowUtc } from '@/lib/date';

export const POST = withApproval(async (session, request: Request) => {
  try {
    const body = await request.json();
    const parsed = createCompletionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { choreId, scheduleId, notes, completedAt } = parsed.data;

    // Verify chore exists
    const chore = await db.chore.findUnique({ where: { id: choreId } });
    if (!chore) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify schedule exists if provided
    if (scheduleId) {
      const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
      if (!schedule) {
        return Response.json({ error: 'Schedule not found' }, { status: 404 });
      }

      // Guardrail: schedule must belong to the provided choreId
      if (schedule.choreId !== choreId) {
        return Response.json(
          { error: 'Schedule does not match chore' },
          { status: 400 },
        );
      }

      // Idempotency: a schedule can only be completed once for the household.
      const existing = await db.choreCompletion.findUnique({
        where: { scheduleId },
        include: {
          chore: { select: { id: true, title: true, frequency: true } },
          user: { select: { id: true, name: true, image: true } },
        },
      });
      if (existing) {
        return Response.json(existing, { status: 200 });
      }
    }

    const completion = await db.choreCompletion.create({
      data: {
        choreId,
        userId: session.user.id,
        scheduleId: scheduleId || null,
        notes: notes ?? null,
        completedAt: completedAt ?? new Date(),
      },
      include: {
        chore: { select: { id: true, title: true, frequency: true } },
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return Response.json(completion, { status: 201 });
  } catch (error) {
    console.error('Failed to create completion:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const GET = withApproval(async (_session, request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = {
      choreId: searchParams.get('choreId') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    };

    const parsed = listCompletionsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { choreId, userId, from, to, limit, offset } = parsed.data;

    const toIsDateOnly = typeof rawQuery.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawQuery.to);
    const fromIsDateOnly = typeof rawQuery.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawQuery.from);

    const where: Record<string, unknown> = {};
    if (choreId) where.choreId = choreId;
    if (userId) where.userId = userId;
    if (from || to) {
      where.completedAt = {
        ...(from && { gte: fromIsDateOnly ? startOfTodayUtc(from) : from }),
        ...(to && (toIsDateOnly ? { lt: startOfTomorrowUtc(to) } : { lte: to })),
      };
    }

    const [completions, total] = await Promise.all([
      db.choreCompletion.findMany({
        where,
        include: {
          chore: { select: { id: true, title: true, frequency: true } },
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.choreCompletion.count({ where }),
    ]);

    return Response.json({ completions, total, limit, offset });
  } catch (error) {
    console.error('Failed to fetch completions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withApproval(async (session, request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    if (!scheduleId?.trim()) {
      return Response.json({ error: 'scheduleId is required' }, { status: 400 });
    }

    await db.choreCompletion.deleteMany({
      where: {
        scheduleId,
        userId: session.user.id,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete completion:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
