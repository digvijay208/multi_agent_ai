import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create a message (and optional agent responses) under a conversation
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { conversationId, role, content, agentResponses } = body || {};

  if (!conversationId || !role || !content) {
    return new Response(JSON.stringify({ error: 'conversationId, role, content are required' }), { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      role,
      content,
      conversationId,
      agentResponses: agentResponses && Array.isArray(agentResponses)
        ? { create: agentResponses.map((ar: any) => ({
            agent: ar.agent,
            model: ar.model,
            content: ar.content,
          })) }
        : undefined,
    },
    include: { agentResponses: true },
  });

  return Response.json({ message });
}
