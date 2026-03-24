import { useState, useCallback, useRef } from 'react';

export interface AgentMessage {
  agent: string;
  model: string;
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
}

export interface StreamingState {
  isLoading: boolean;
  currentAgent: string | null;
  agents: Map<string, AgentMessage>;
  error: string | null;
  isComplete: boolean;
  conversationId?: string;
}

export function useStreamingChat() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isLoading: false,
    currentAgent: null,
    agents: new Map(),
    error: null,
    isComplete: false,
    conversationId: undefined,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string, existingConversationId?: string) => {
    // Reset state
    setStreamingState({
      isLoading: true,
      currentAgent: null,
      agents: new Map(),
      error: null,
      isComplete: false,
      conversationId: existingConversationId,
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to chat service');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events (SSE format: "data: {...}\n\n")
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim() || !event.startsWith('data: ')) continue;

          try {
            const jsonStr = event.replace(/^data: /, '');
            const data = JSON.parse(jsonStr);

            setStreamingState((prev) => {
              const newState = { ...prev };
              const newAgents = new Map(prev.agents);

              switch (data.type) {
                case 'agent_start':
                  newAgents.set(data.agent, {
                    agent: data.agent,
                    model: data.model || '',
                    content: '',
                    isStreaming: true,
                    isComplete: false,
                  });
                  newState.currentAgent = data.agent;
                  newState.agents = newAgents;
                  break;

                case 'content':
                  if (data.agent && newAgents.has(data.agent)) {
                    const agentMsg = newAgents.get(data.agent)!;
                    agentMsg.content += data.content || '';
                    newAgents.set(data.agent, agentMsg);
                    newState.agents = newAgents;
                  }
                  break;

                case 'agent_complete':
                  if (data.agent && newAgents.has(data.agent)) {
                    const agentMsg = newAgents.get(data.agent)!;
                    agentMsg.content = data.fullResponse || agentMsg.content;
                    agentMsg.isStreaming = false;
                    agentMsg.isComplete = true;
                    newAgents.set(data.agent, agentMsg);
                    newState.agents = newAgents;
                  }
                  newState.currentAgent = null;
                  break;

                case 'error':
                  newState.error = data.message || 'An error occurred';
                  newState.isLoading = false;
                  newState.currentAgent = null;
                  break;

                case 'complete':
                  newState.isLoading = false;
                  newState.isComplete = true;
                  newState.currentAgent = null;
                  break;
              }

              return newState;
            });
          } catch (parseError) {
            console.error('Failed to parse SSE event:', parseError, event);
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
      }
      console.error('Streaming error:', error);
      setStreamingState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to stream response',
        currentAgent: null,
      }));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingState((prev) => {
      // Mark all currently streaming agents as complete so the UI can render them
      const newAgents = new Map(prev.agents);
      newAgents.forEach((agentMsg, agentId) => {
        if (agentMsg.isStreaming) {
          newAgents.set(agentId, { ...agentMsg, isStreaming: false, isComplete: true });
        }
      });
      return {
        ...prev,
        isLoading: false,
        isComplete: true, // Trigger completion to save partial response
        currentAgent: null,
        agents: newAgents
      };
    });
  }, []);

  const resetStream = useCallback(() => {
    setStreamingState({
      isLoading: false,
      currentAgent: null,
      agents: new Map(),
      error: null,
      isComplete: false,
      conversationId: undefined,
    });
  }, []);

  return {
    streamingState,
    sendMessage,
    stopStream,
    resetStream,
  };
}
