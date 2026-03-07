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

export default function ModernChatInterface() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

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
        body: JSON.stringify({ message: userMessage.content })
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

  return (
    <div className="flex h-screen w-full">
      <aside className="w-64 flex flex-col border-r border-slate-700 bg-slate-900">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-lg">
              <span className="text-white text-xl">⚡</span>
            </div>
            <div>
              <h1 className="text-base font-bold">FusionAI</h1>
              <p className="text-xs text-slate-400">Unified Intelligence</p>
            </div>
          </div>
          
          <button 
            onClick={() => setChatHistory([])}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold mb-6 hover:bg-blue-700"
          >
            <span>➕</span>
            <span>New Chat</span>
          </button>

          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600/20 text-blue-400">
              <span>💬</span>
              <span className="text-sm font-medium">Active Chat</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer">
              <span>🕐</span>
              <span className="text-sm font-medium">History</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer">
              <span>⚙️</span>
              <span className="text-sm font-medium">Settings</span>
            </div>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800"></div>
            <div className="flex-1">
              <p className="text-xs font-semibold">User</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-950">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-400">
              Current Session: {chatHistory.length > 0 ? 'Active' : 'New Chat'}
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600/20 text-blue-400 uppercase">
              Unified Mode
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:text-blue-400">📤</button>
            <button onClick={() => setChatHistory([])} className="p-2 text-slate-500 hover:text-blue-400">🗑️</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-10">
            {chatHistory.length === 0 ? (
              <div className="text-center mt-20">
                <div className="w-16 h-16 bg-blue-600/20 flex items-center justify-center rounded-2xl mx-auto mb-4">
                  <span className="text-4xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Welcome to FusionAI</h3>
                <p className="text-slate-400">Fusion of GPT-4o, Claude Sonnet 4-6, and Gemini 2.5 Pro</p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-600 text-white px-6 py-4 rounded-2xl rounded-tr-none">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/20 flex items-center justify-center rounded-lg">
                          <span>✨</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase text-blue-400">FusionAI Response</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">Synthesized from:</span>
                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">GPT-4o</span>
                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">Claude</span>
                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">Gemini</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative p-8 rounded-3xl bg-slate-900 border border-slate-800">
                        <div className="absolute -top-3 right-8">
                          <div className="px-3 py-1 bg-slate-800 text-xs font-bold text-white rounded-full flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span> Optimized
                          </div>
                        </div>
                        <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: msg.content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl" />') }} />
                        <div className="mt-6 flex gap-4 border-t border-slate-800 pt-4">
                          <button className="text-xs text-slate-500 hover:text-blue-400">👍</button>
                          <button className="text-xs text-slate-500 hover:text-blue-400">👎</button>
                          <button className="text-xs text-slate-500 hover:text-blue-400">📋</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-2 w-32 bg-slate-800 rounded-full animate-pulse"></div>
                  <div className="h-2 w-full bg-slate-800 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-900/50">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-2">
                <div className="flex items-end gap-2">
                  <button type="button" className="p-3 text-slate-400 hover:text-blue-400">📎</button>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 text-sm py-3 px-2 resize-none placeholder-slate-500 min-h-[50px] max-h-[200px] outline-none text-white"
                    placeholder="Ask FusionAI... (Shift + Enter for new line)"
                    rows={1}
                    disabled={loading}
                  />
                  <div className="flex items-center gap-1 pr-2 pb-1.5">
                    <button type="button" className="p-2 text-slate-400 hover:text-blue-400">🎤</button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
                    >
                      ⬆️
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="mt-3 flex justify-center items-center gap-6 text-xs text-slate-500">
              <p>🔒 Privacy Shield Active</p>
              <p>⚡ Turbo Engine v2.4</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
