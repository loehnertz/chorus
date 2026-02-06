import { Prisma } from '@prisma/client'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  await requireApprovedUser()

  const { id } = await context.params
  if (!id) {
    return Response.json({ error: 'Schedule ID is required' }, { status: 400 })
  }

  try {
    await db.schedule.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return Response.json({ error: 'Schedule not found' }, { status: 404 })
    }

    console.error('Failed to delete schedule:', error)
    return Response.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
