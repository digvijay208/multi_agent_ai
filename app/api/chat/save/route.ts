import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Save a full turn (user message + assistant message with agent responses) to conversation
// If no conversationId provided, creates a new one.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { conversationId, userMessage, assistantMessage, agentResponses } = body || {};

  if (!userMessage || !assistantMessage) {
    return new Response(JSON.stringify({ error: 'userMessage and assistantMessage are required' }), { status: 400 });
  }

  // Ensure conversation exists
  let convoId = conversationId as string | undefined;
  if (!convoId) {
    const convo = await prisma.conversation.create({ data: { title: userMessage.slice(0, 60) } });
    convoId = convo.id;
  }

  // Save user message
  await prisma.message.create({
    data: {
      role: 'user',
      content: userMessage,
      conversationId: convoId,
    },
  });

  // Save assistant message and agent responses
  const assistant = await prisma.message.create({
    data: {
      role: 'assistant',
      content: assistantMessage,
      conversationId: convoId,
      agentResponses: agentResponses && Array.isArray(agentResponses)
        ? {
            create: agentResponses.map((ar: any) => ({
              agent: ar.agent,
              model: ar.model,
              content: ar.content,
            })),
          }
        : undefined,
    },
    include: { agentResponses: true },
  });

  return Response.json({ conversationId: convoId, assistant });
}
