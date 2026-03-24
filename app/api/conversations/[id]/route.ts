import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get a single conversation with messages and agent responses
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
        include: { agentResponses: true },
      },
    },
  });

  if (!convo) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  return Response.json({ conversation: convo });
}

// Delete conversation
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.conversation.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}
