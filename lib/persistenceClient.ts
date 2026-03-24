// Client-side helpers to call our conversation persistence APIs

export async function fetchConversations() {
  const res = await fetch('/api/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  const data = await res.json();
  return data.conversations as Array<{ id: string; title: string | null; createdAt: string; updatedAt: string; _count?: { messages: number } }>;
}

export async function fetchConversation(id: string) {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) throw new Error('Conversation not found');
  const data = await res.json();
  return data.conversation;
}

export async function createConversationOnServer(title?: string) {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  const data = await res.json();
  return data.conversation as { id: string; title: string | null };
}

export async function saveTurnToServer(params: {
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
  agentResponses?: Array<{ agent: string; model: string; content: string }>;
}) {
  const res = await fetch('/api/chat/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to save messages');
  return res.json() as Promise<{ conversationId: string }>;
}
