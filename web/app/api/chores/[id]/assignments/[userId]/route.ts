import { db } from '@/lib/db';
import { requireApprovedUserApi, isErrorResponse } from '@/lib/auth/require-approval';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const { id: choreId, userId } = await params;

    const assignment = await db.choreAssignment.findUnique({
      where: { userId_choreId: { userId, choreId } },
    });

    if (!assignment) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await db.choreAssignment.delete({
      where: { userId_choreId: { userId, choreId } },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to unassign chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
