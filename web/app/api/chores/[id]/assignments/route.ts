import { db } from '@/lib/db';
import { requireApprovedUserApi, isErrorResponse } from '@/lib/auth/require-approval';
import { assignChoreSchema, formatValidationError } from '@/lib/validations';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const { id: choreId } = await params;
    const body = await request.json();
    const parsed = assignChoreSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { userId } = parsed.data;

    // Verify chore exists
    const chore = await db.chore.findUnique({ where: { id: choreId } });
    if (!chore) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if assignment already exists
    const existing = await db.choreAssignment.findUnique({
      where: { userId_choreId: { userId, choreId } },
    });
    if (existing) {
      return Response.json({ error: 'User is already assigned to this chore' }, { status: 409 });
    }

    const assignment = await db.choreAssignment.create({
      data: { userId, choreId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        chore: { select: { id: true, title: true, frequency: true } },
      },
    });

    return Response.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Failed to assign chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
