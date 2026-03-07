'use client';

import { useState } from 'react';

interface AgentResponse {
  agent: string;
  model: string;
  response: string;
  timestamp: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  responses?: AgentResponse[];
  timestamp: number;
}

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await res.json();
      
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.responses[0]?.response || 'No response',
          responses: data.responses,
          timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      alert('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all chat history?')) {
      setChatHistory([]);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>⚡ FusionAI</h1>
        {chatHistory.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear History
          </button>
        )}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
        {chatHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
            <p style={{ fontSize: '18px' }}>⚡ Welcome to FusionAI!</p>
            <p>Fusion of GPT-4o, Claude Sonnet 4-6, and Gemini 2.5 Pro</p>
            <p style={{ fontSize: '14px', marginTop: '20px' }}>Try asking:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>• "Explain quantum computing"</li>
              <li>• "Generate image of a sunset"</li>
              <li>• "Write a Python function to sort arrays"</li>
            </ul>
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '20px',
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5'
              }}
            >
              <strong style={{ color: msg.role === 'user' ? '#1976d2' : '#388e3c' }}>
                {msg.role === 'user' ? '👤 You' : '🤖 AI'}
              </strong>
              <div 
                style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ 
                  __html: msg.content.replace(
                    /!\[([^\]]*)\]\(([^)]+)\)/g, 
                    '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin-top: 10px;" />'
                  )
                }}
              />
              {msg.responses && msg.responses[0]?.model && (
                <small style={{ color: '#666' }}>Model: {msg.responses[0].model}</small>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <p>🤔 AI agents are thinking...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything... (text, code, images, etc.)"
            style={{
              flex: 1,
              padding: '15px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px'
            }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
