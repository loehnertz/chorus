import { db } from '@/lib/db';
import { requireApprovedUserApi, isErrorResponse } from '@/lib/auth/require-approval';
import { Frequency } from '@prisma/client';
import { createChoreSchema, formatValidationError } from '@/lib/validations';

const VALID_FREQUENCIES = Object.values(Frequency);

export async function GET(request: Request) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency');
    const search = searchParams.get('search');

    // Validate frequency if provided
    if (frequency && !VALID_FREQUENCIES.includes(frequency as Frequency)) {
      return Response.json(
        { error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}` },
        { status: 400 },
      );
    }

    const chores = await db.chore.findMany({
      where: {
        ...(frequency && { frequency: frequency as Frequency }),
        ...(search && {
          title: { contains: search, mode: 'insensitive' as const },
        }),
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(chores);
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const body = await request.json();
    const parsed = createChoreSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { title, frequency, description, assigneeIds } = parsed.data;

    const chore = await db.chore.create({
      data: {
        title,
        frequency,
        description: description ?? null,
        ...(assigneeIds?.length && {
          assignments: {
            create: assigneeIds.map((userId: string) => ({ userId })),
          },
        }),
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return Response.json(chore, { status: 201 });
  } catch (error) {
    console.error('Failed to create chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
