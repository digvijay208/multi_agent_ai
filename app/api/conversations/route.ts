import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// List conversations
export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return Response.json({ conversations });
}

// Create conversation
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { title } = body || {};

  const convo = await prisma.conversation.create({
    data: { title: title || null },
  });

  return Response.json({ conversation: convo });
}
