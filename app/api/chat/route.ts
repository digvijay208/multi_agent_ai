import { NextRequest, NextResponse } from 'next/server';
import { runMultiAgentDiscussion } from '@/lib/multiAgent';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const agentResponses = await runMultiAgentDiscussion(message);

    return NextResponse.json({ responses: agentResponses });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
