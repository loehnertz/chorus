import { db } from '@/lib/db';
import { requireApprovedUserApi, isErrorResponse } from '@/lib/auth/require-approval';
import { Frequency } from '@prisma/client';

const VALID_FREQUENCIES = Object.values(Frequency);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const { id } = await params;

    const chore = await db.chore.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 5,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: {
          select: { completions: true },
        },
      },
    });

    if (!chore) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    return Response.json(chore);
  } catch (error) {
    console.error('Failed to fetch chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const { id } = await params;
    const body = await request.json();
    const { title, frequency, description, assigneeIds } = body;

    // Validate title if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return Response.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    // Validate frequency if provided
    if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
      return Response.json(
        { error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}` },
        { status: 400 },
      );
    }

    // Check chore exists
    const existing = await db.chore.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (frequency !== undefined) updateData.frequency = frequency;
    if (description !== undefined) updateData.description = description?.trim() || null;

    if (assigneeIds !== undefined) {
      // Use transaction to replace assignments atomically
      const chore = await db.$transaction(async (tx) => {
        await tx.choreAssignment.deleteMany({ where: { choreId: id } });
        return tx.chore.update({
          where: { id },
          data: {
            ...updateData,
            ...(assigneeIds.length && {
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
      });

      return Response.json(chore);
    }

    const chore = await db.chore.update({
      where: { id },
      data: updateData,
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return Response.json(chore);
  } catch (error) {
    console.error('Failed to update chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const { id } = await params;

    const existing = await db.chore.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    await db.chore.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
