import { prisma } from './prisma';

export async function listConversations() {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversationWithMessages(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
        include: { agentResponses: true },
      },
    },
  });
}

export async function saveTurn(params: {
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
  agentResponses?: Array<{ agent: string; model: string; content: string }>;
}) {
  const { conversationId, userMessage, assistantMessage, agentResponses } = params;

  let convoId = conversationId;
  if (!convoId) {
    const convo = await prisma.conversation.create({ data: { title: userMessage.slice(0, 60) } });
    convoId = convo.id;
  }

  await prisma.message.create({
    data: {
      role: 'user',
      content: userMessage,
      conversationId: convoId,
    },
  });

  const assistant = await prisma.message.create({
    data: {
      role: 'assistant',
      content: assistantMessage,
      conversationId: convoId,
      agentResponses: agentResponses && Array.isArray(agentResponses)
        ? { create: agentResponses.map((ar) => ({ agent: ar.agent, model: ar.model, content: ar.content })) }
        : undefined,
    },
    include: { agentResponses: true },
  });

  return { conversationId: convoId, assistant };
}
