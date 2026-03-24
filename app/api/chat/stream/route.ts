import { NextRequest } from 'next/server';
import { streamMultiAgentDiscussion, StreamEvent } from '@/lib/multiAgentStream';

export const runtime = 'nodejs'; // Use Node.js runtime for streaming

/**
 * POST /api/chat/stream
 * Streaming endpoint for multi-agent AI discussions
 * Returns Server-Sent Events (SSE) for real-time updates
 */
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a non-empty string' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a readable stream
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the multi-agent discussion
          for await (const event of streamMultiAgentDiscussion(message)) {
            // Format as Server-Sent Event
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // Close the stream
          controller.close();
        } catch (error: any) {
          console.error('Stream error:', error);
          
          // Send error event before closing
          const errorEvent: StreamEvent = {
            type: 'error',
            message: error.message || 'An unexpected error occurred during streaming',
            metadata: { error: error.toString() }
          };
          
          const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }
      }
    });

    // Return streaming response with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error in chat stream endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
