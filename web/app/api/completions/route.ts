import { db } from '@/lib/db';
import { requireApprovedUserApi, isErrorResponse } from '@/lib/auth/require-approval';
import { createCompletionSchema, formatValidationError } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;
    const session = result;

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
}

export async function GET(request: Request) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const { searchParams } = new URL(request.url);
    const choreId = searchParams.get('choreId');
    const userId = searchParams.get('userId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);

    const where: Record<string, unknown> = {};
    if (choreId) where.choreId = choreId;
    if (userId) where.userId = userId;
    if (from || to) {
      where.completedAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
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
}
