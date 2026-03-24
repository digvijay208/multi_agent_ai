'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStreamingChat, AgentMessage } from '@/lib/useStreamingChat';
import { saveTurnToServer, createConversationOnServer, fetchConversations, fetchConversation } from '@/lib/persistenceClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agentResponses?: Map<string, AgentMessage>;
  timestamp: number;
  isStreaming?: boolean;
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500/20 border-red-500/50' : type === 'success' ? 'bg-green-500/20 border-green-500/50' : 'bg-blue-500/20 border-blue-500/50';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} border backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl z-50 animate-[fadeIn_0.3s_ease-out] max-w-md`}>
      <p className="text-sm text-[#2a3343] dark:text-white">{message}</p>
    </div>
  );
}

// Code block with copy button
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 not-prose">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 px-3 py-1.5 bg-[#2a3343] dark:bg-[#262627] hover:bg-[#cacce8] dark:hover:bg-[#2f2f2f] border border-white/10 dark:border-white/5 rounded-lg text-xs text-[#f2f6fb] dark:text-[#adaaab] transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
      <pre className="bg-[#060d22] dark:bg-[#0e0e0f] text-[#f2f6fb] border border-[#dbd7de] dark:border-white/5 rounded-2xl p-4 overflow-x-auto text-sm">
        <code className={`text-[#f2f6fb] ${language ? `language-${language}` : ''}`}>{code}</code>
      </pre>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-3/4 bg-[#e4e6f6] dark:bg-[#262627] rounded-full"></div>
      <div className="h-3 w-1/2 bg-[#e4e6f6] dark:bg-[#262627] rounded-full"></div>
      <div className="h-3 w-full bg-[#e4e6f6] dark:bg-[#262627] rounded-full"></div>
      <div className="h-3 w-2/3 bg-[#e4e6f6] dark:bg-[#262627] rounded-full"></div>
    </div>
  );
}

// Icons (Inline SVGs)
const Icons = {
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  MessageCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
  ),
  History: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  ),
  Stop: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>
  ),
  Refresh: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
  ),
  ChevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  ),
  Avatar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
  )
};


  
  
  const MarkdownComponents = {
    pre({ children }: any) {
      return <>{children}</>;
    },
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(w+)/.exec(className || '');
      const codeString = String(children).trimEnd();
      if (!inline && match) {
        return <CodeBlock code={codeString} language={match[1]} />;
      }
      if (!inline) {
        return <CodeBlock code={codeString} language="text" />;
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };
export default function EnhancedChatInterface() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<number>>(new Set());
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check initial theme
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };
  
  // Conversation state
  const [conversations, setConversations] = useState<Array<{ id: string; title: string | null; createdAt: string; updatedAt: string }>>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const lastUserMessageRef = useRef<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { streamingState, sendMessage, stopStream, resetStream } = useStreamingChat();

  const loadConversationsList = async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  useEffect(() => {
    loadConversationsList();
  }, []);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamingState]);

  // Handle streaming completion
  useEffect(() => {
    if (streamingState.isComplete && streamingState.agents.size > 0) {
      const mainContent = Array.from(streamingState.agents.values())
        .map(a => a.content)
        .pop() || '';

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: mainContent,
        agentResponses: new Map(streamingState.agents),
        timestamp: Date.now(),
        isStreaming: false
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      resetStream();
      setToast({ message: 'Response complete!', type: 'success' });

      // Save to server
      const agentRespArray = Array.from(streamingState.agents.values()).map(a => ({
        agent: a.agent,
        model: a.model,
        content: a.content
      }));

      saveTurnToServer({
        conversationId: currentConversationId,
        userMessage: lastUserMessageRef.current,
        assistantMessage: mainContent,
        agentResponses: agentRespArray
      }).then(res => {
        if (!currentConversationId) {
          setCurrentConversationId(res.conversationId);
          loadConversationsList();
        }
      }).catch(err => {
        console.error('Failed to save turn', err);
      });
    }
  }, [streamingState.isComplete, streamingState.agents, resetStream, currentConversationId]);

  // Handle streaming errors
  useEffect(() => {
    if (streamingState.error) {
      setToast({ message: streamingState.error, type: 'error' });
    }
  }, [streamingState.error]);

  // Keyboard shortcut: Cmd/Ctrl + K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || streamingState.isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMessage]);
    lastUserMessageRef.current = message;
    setMessage('');
    
    // Start streaming
    await sendMessage(userMessage.content);
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setCurrentConversationId(undefined);
    resetStream();
    setToast({ message: 'New conversation started', type: 'info' });
  };

  const handleLoadConversation = async (id: string) => {
    try {
      setToast({ message: 'Loading conversation...', type: 'info' });
      const data = await fetchConversation(id);
      setCurrentConversationId(id);
      
      const loadedHistory: ChatMessage[] = data.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
        agentResponses: msg.agentResponses && msg.agentResponses.length > 0
          ? new Map(msg.agentResponses.map((ar: any) => [ar.agent, {
              agent: ar.agent,
              model: ar.model,
              content: ar.content,
              isStreaming: false,
              isComplete: true
            }]))
          : undefined
      }));
      
      setChatHistory(loadedHistory);
      resetStream();
      setToast({ message: 'Conversation loaded', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to load conversation', type: 'error' });
      console.error(err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        handleNewChat();
      }
      setToast({ message: 'Session deleted', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete session', type: 'error' });
      console.error(err);
    }
  };

  const handleRegenerate = useCallback(async (messageIndex: number) => {
    if (messageIndex < 1) return;
    
    const userMsg = chatHistory[messageIndex - 1];
    if (userMsg.role !== 'user') return;

    // Remove the assistant response and regenerate
    setChatHistory(prev => prev.slice(0, messageIndex));
    await sendMessage(userMsg.content);
    setToast({ message: 'Regenerating response...', type: 'info' });
  }, [chatHistory, sendMessage]);

  const handleExport = () => {
    if (chatHistory.length === 0) {
      setToast({ message: 'No conversation to export', type: 'error' });
      return;
    }
    
    let mdContent = `# FusionAI Session\n\n`;
    const date = new Date().toLocaleString();
    mdContent += `*Exported on: ${date}*\n\n---\n\n`;
    
    chatHistory.forEach(msg => {
      const roleName = msg.role === 'user' ? '👤 User' : '🤖 FusionAI';
      mdContent += `### ${roleName}\n\n${msg.content}\n\n---\n\n`;
    });
    
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FusionAI-Session-${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setToast({ message: 'Conversation exported as Markdown', type: 'success' });
  };

  const toggleAgentExpansion = (index: number) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 flex bg-[#f2f6fb] dark:bg-[#0e0e0f] text-[#2a3343] dark:text-white font-sans selection:bg-[#00F0FF]/30 overflow-hidden">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 flex flex-col bg-white border-r border-[#dbd7de] dark:border-none dark:bg-[#131314] z-10 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10 group cursor-pointer">
            <div className="w-12 h-12 bg-[#e4e6f6] dark:bg-[#201f21] flex items-center justify-center rounded-2xl shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.05)] transition-all duration-500 dark:group-hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] text-[#060d22] dark:text-[#00F0FF]">
              <Icons.Logo />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#060d22] dark:text-white mb-0.5">FusionAI</h1>
              <p className="text-xs text-[#2a3343]/80 dark:text-[#adaaab] font-medium tracking-wide">MULTI-AGENT NEXUS</p>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-[#060d22] text-[#f2f6fb] dark:bg-[#00eefc] dark:text-[#003f43] text-sm font-semibold mb-8 transition-all duration-500 ease-out hover:bg-[#2a3343] dark:hover:bg-[#00deec] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            title="New Thread (⌘K / Ctrl+K)"
          >
            <Icons.Plus />
            New Thread
          </button>

          <nav className="space-y-2 mb-6">
            <div 
              onClick={handleNewChat}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${!currentConversationId ? 'bg-[#e4e6f6] dark:bg-[#262627] text-[#060d22] dark:text-[#00F0FF] shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'text-[#2a3343]/80 dark:text-[#adaaab] hover:bg-[#cacce8] dark:hover:bg-[#201f21] hover:text-[#2a3343] dark:hover:text-white'}`}
            >
              <Icons.MessageCircle />
              <span className="text-sm font-medium tracking-tight">Active Context</span>
            </div>
          </nav>
          
          <div className="flex items-center gap-2 px-2 mb-3">
            <Icons.History />
            <h3 className="text-xs font-bold text-[#2a3343]/80 dark:text-[#adaaab] uppercase tracking-wider">Session History</h3>
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-[35vh] pr-2 custom-scrollbar">
            {conversations.length === 0 ? (
              <p className="text-xs text-[#2a3343]/80 dark:text-[#adaaab]/60 px-2 italic">No previous sessions</p>
            ) : (
              conversations.map(convo => (
                <div 
                  key={convo.id}
                  onClick={() => handleLoadConversation(convo.id)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors duration-300 ${currentConversationId === convo.id ? 'bg-[#e4e6f6] dark:bg-[#262627] text-[#2a3343] dark:text-white border border-[#00F0FF]/20' : 'text-[#2a3343]/80 dark:text-[#adaaab] hover:bg-[#cacce8] dark:hover:bg-[#201f21] hover:text-[#2a3343] dark:hover:text-white'}`}
                >
                  <span className="text-sm tracking-tight truncate flex-1">
                    {convo.title || 'Untitled Session'}
                  </span>
                  <button 
                    onClick={(e) => handleDeleteConversation(e, convo.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all text-[#2a3343]/80 dark:text-[#adaaab] hover:text-red-400"
                    title="Delete session"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto p-6">
          <div className="px-4 py-4 rounded-3xl bg-gradient-to-br from-[#00F0FF]/10 to-[#7000ff]/10 border border-[#dbd7de] dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00F0FF]/20 blur-[30px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-[#131314] flex items-center justify-center border border-[#dbd7de] dark:border-white/10 text-[#2a3343] dark:text-white shadow-lg">
                <Icons.Avatar />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Enterprise User</p>
                <p className="text-[10px] text-[#2a3343] dark:text-[#00F0FF] tracking-wide font-medium">NVIDIA NIM LINK</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-[#f2f6fb] dark:bg-[#0e0e0f] relative overflow-hidden min-h-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#7000ff]/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <header className="h-20 shrink-0 flex items-center justify-between px-10 relative z-10 backdrop-blur-xl bg-white/80 dark:bg-[#0e0e0f]/60 border-b border-[#dbd7de] dark:border-white/[0.02]">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-[#2a3343]/80 dark:text-[#adaaab] tracking-tight">
              Session: <span className="text-[#060d22] dark:text-white">{chatHistory.length > 0 ? 'Collaborative Discussion' : 'Ready'}</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#7000ff]/20 text-[#ac89ff] uppercase tracking-wider border border-[#7000ff]/30">
              Streaming Mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#cacce8]/50 dark:bg-[#262627] text-[#060d22] dark:text-[#adaaab] hover:bg-[#cacce8] dark:hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            <div className="text-[11px] text-[#2a3343]/80 dark:text-[#adaaab] hidden sm:block">
              ⌘K / Ctrl+K: New Chat
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e4e6f6] dark:bg-[#262627] hover:bg-white dark:bg-[#2f2f2f] border border-[#dbd7de] dark:border-white/5 text-[#2a3343]/80 dark:text-[#adaaab] hover:text-[#2a3343] dark:text-white transition-colors text-xs font-medium"
                title="Export as Markdown"
              >
                <Icons.Download />
                Export
              </button>
            )}
          </div>
        </header>

        {/* Chat messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-10 pb-30 relative z-10 scroll-smooth">
          <div className="max-w-4xl mx-auto pt-10">
            {chatHistory.length === 0 && !streamingState.isLoading ? (
              <div className="flex flex-col items-center justify-center mt-32 opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
                <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF] to-[#7000ff] rounded-3xl blur-[20px] opacity-20" />
                  <div className="w-24 h-24 bg-white shadow-[0_4px_20px_-4px_rgba(42,52,57,0.08)] dark:border-none dark:shadow-none dark:bg-[#131314] rounded-3xl flex items-center justify-center relative z-10 border border-[#dbd7de] dark:border-white/5 dark:shadow-2xl text-[#060d22] dark:text-[#00F0FF]">
                    <Icons.Logo />
                  </div>
                </div>
                <h3 className="text-4xl font-extrabold mb-3 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#060d22] to-[#2a3343] dark:from-white dark:to-[#adaaab]">
                  What shall we explore today?
                </h3>
                <p className="text-base text-[#2a3343]/80 dark:text-[#adaaab] font-medium tracking-tight">
                  Multi-agent collaboration with GPT-OSS and Gemma
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className="group">
                    {msg.role === 'user' ? (
                      <div className="flex justify-end pt-4">
                        <div className="max-w-[75%] bg-[#2a3343] text-[#f2f6fb] dark:bg-[#201f21] dark:text-white border border-[#2a3343] dark:border-white/[0.03] px-6 py-4 rounded-3xl rounded-tr-sm shadow-md dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                          <p className="text-base text-[#f2f6fb] dark:text-white leading-relaxed tracking-tight">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5 animate-[fadeIn_0.5s_ease-out_forwards]">
                        {/* Show individual agent responses if available */}
                        {msg.agentResponses && msg.agentResponses.size > 0 && (
                          <div className="space-y-4">
                            <button
                              onClick={() => toggleAgentExpansion(idx)}
                              className="flex items-center gap-2 text-sm text-[#060d22] dark:text-[#00F0FF] hover:text-[#2a3343] dark:hover:text-[#00deec] transition-colors"
                            >
                              <Icons.ChevronDown />
                              <span>{expandedAgents.has(idx) ? 'Hide' : 'Show'} Agent Responses ({msg.agentResponses.size})</span>
                            </button>

                            {expandedAgents.has(idx) && (
                              <div className="space-y-4 pl-4 border-l-2 border-[#00F0FF]/20">
                                {Array.from(msg.agentResponses.entries()).map(([agentName, agentMsg]) => (
                                  <div key={agentName} className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-[#e4e6f6] dark:bg-gradient-to-br dark:from-[#00F0FF]/20 dark:to-[#7000ff]/20 flex items-center justify-center rounded-lg border border-[#dbd7de] dark:border-[#00F0FF]/20 text-[#2a3343] dark:text-[#00F0FF]">
                                        <Icons.Logo />
                                      </div>
                                      <div>
                                        <h5 className="text-xs font-bold uppercase tracking-widest text-[#060d22] dark:text-[#00F0FF]">
                                          {agentName === 'gpt-oss' ? 'GPT-OSS' : agentName === 'gemma' ? 'Gemma' : 'Flux'}
                                        </h5>
                                        <p className="text-[10px] text-[#2a3343]/80 dark:text-[#adaaab]">{agentMsg.model}</p>
                                      </div>
                                    </div>

                                    <div className="relative p-6 rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(42,52,57,0.04)] border border-[#dbd7de] dark:border-none dark:shadow-none dark:bg-[#131314] overflow-hidden">
                                      <div className="prose prose-slate text-[#2a3343] dark:text-white dark:prose-invert prose-p:leading-relaxed prose-code:text-[#060d22] prose-code:bg-[#e4e6f6] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:hidden prose-code:after:hidden dark:prose-code:text-[#00F0FF] dark:prose-code:bg-[#201f21] max-w-none prose-img:rounded-2xl prose-img:shadow-md text-[14px]">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                          {agentMsg.content}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Final synthesized response */}
                        <div className="relative p-8 rounded-3xl bg-white shadow-[0_4px_20px_-4px_rgba(42,52,57,0.04)] border border-[#dbd7de] dark:border-none dark:shadow-none dark:bg-[#131314] overflow-hidden hover:bg-[#f2f6fb] dark:group-hover:bg-[#1a191b] transition-colors duration-500">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent" />
                          <div className="absolute top-6 right-6 flex items-center gap-2">
                            <button
                              onClick={() => handleRegenerate(idx)}
                              className="p-2 bg-[#e4e6f6] dark:bg-[#262627] hover:bg-white dark:bg-[#2f2f2f] border border-[#dbd7de] dark:border-white/5 shadow-lg text-[10px] font-bold text-[#2a3343]/80 dark:text-[#adaaab] rounded-full flex items-center justify-center transition-all hover:scale-105"
                              title="Regenerate response"
                            >
                              <Icons.Refresh />
                            </button>
                          </div>

                          <div className="prose prose-slate text-[#2a3343] dark:text-white dark:prose-invert prose-p:leading-relaxed prose-code:text-[#060d22] prose-code:bg-[#e4e6f6] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:hidden prose-code:after:hidden dark:prose-code:text-[#00F0FF] dark:prose-code:bg-[#201f21] max-w-none prose-img:rounded-2xl prose-img:shadow-md text-[15px]">
                            <ReactMarkdown
                              components={MarkdownComponents}
                              remarkPlugins={[remarkGfm]}
                              urlTransform={(url) => {
                                if (url.startsWith('data:image/')) return url;
                                return defaultUrlTransform(url);
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming in progress */}
                {streamingState.isLoading && (
                  <div className="space-y-5 animate-[fadeIn_0.5s_ease-out_forwards]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#e4e6f6] dark:bg-[#262627] flex items-center justify-center rounded-xl border border-[#ff59e3]/30 shadow-[0_0_15px_rgba(255,89,227,0.2)] animate-pulse text-[#060d22] dark:text-[#ff59e3]">
                        <Icons.Logo />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#060d22] dark:text-[#ff59e3] mb-1 flex items-center gap-2">
                          {streamingState.currentAgent === 'gpt-oss' ? 'GPT-OSS Analyzing' : 
                           streamingState.currentAgent === 'gemma' ? 'Gemma Synthesizing' :
                           streamingState.currentAgent === 'flux' ? 'Generating Image' : 
                           'Processing'}
                          <span className="flex gap-1 animate-pulse">
                            <span className="w-1 h-1 bg-[#ff59e3] rounded-full"></span>
                            <span className="w-1 h-1 bg-[#ff59e3] rounded-full"></span>
                            <span className="w-1 h-1 bg-[#ff59e3] rounded-full"></span>
                          </span>
                        </h4>
                      </div>
                    </div>

                    {/* Show streaming content */}
                    {Array.from(streamingState.agents.entries()).map(([agentName, agentMsg]) => (
                      <div key={agentName} className="relative p-8 rounded-3xl bg-white shadow-[0_4px_20px_-4px_rgba(42,52,57,0.04)] border border-[#dbd7de] dark:border-none dark:shadow-none dark:bg-[#131314]">
                        <div className="text-xs text-[#2a3343]/80 dark:text-[#adaaab] mb-4 uppercase tracking-wider">
                          {agentName === 'gpt-oss' ? 'GPT-OSS' : agentName === 'gemma' ? 'Gemma' : 'Flux'} 
                          {agentMsg.isStreaming && ' (streaming...)'}
                        </div>
                        <div className="prose prose-slate text-[#2a3343] dark:text-white dark:prose-invert prose-p:leading-relaxed prose-code:text-[#060d22] prose-code:bg-[#e4e6f6] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:hidden prose-code:after:hidden dark:prose-code:text-[#00F0FF] dark:prose-code:bg-[#201f21] max-w-none prose-img:rounded-2xl prose-img:shadow-md text-[15px]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                            {agentMsg.content || '...'}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}

                    {streamingState.agents.size === 0 && <LoadingSkeleton />}
                  </div>
                )}
              </div>
            )}
            <div className="h-16" />
          </div>
        </div>

        {/* Input area */}
        {/* Stick the input dock to the very bottom with a compact top padding so it doesn’t float up */}
        <div className="absolute inset-x-0 bottom-0 w-full pt-1 pb-0 bg-gradient-to-t from-[#f2f6fb] via-[#f2f6fb] dark:from-[#0e0e0f] dark:via-[#0e0e0f] to-transparent z-20 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto px-4">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="bg-white dark:bg-[#2f2f2f]/80 border border-[#dbd7de] dark:border-white/5 rounded-full p-2 shadow-[0_8px_30px_-4px_rgba(42,52,57,0.08)] dark:shadow-2xl backdrop-blur-3xl transition-all duration-500 hover:bg-white dark:bg-[#2f2f2f] focus-within:bg-white dark:bg-[#2f2f2f]">
                <div className="flex items-center gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 text-[15px] py-3 px-4 resize-none placeholder-[#2a3343]/50 dark:placeholder-[#adaaab]/70 max-h-[200px] outline-none text-[#060d22] dark:text-white tracking-tight leading-relaxed font-medium"
                    placeholder="Ask the multi-agent collective... (Shift + Enter for new line)"
                    rows={1}
                    disabled={streamingState.isLoading}
                    style={{ minHeight: '48px' }}
                  />
                  <div className="flex items-center gap-1 pr-2">
                    {streamingState.isLoading ? (
                      <button
                        type="button"
                        onClick={stopStream}
                        className="w-10 h-10 bg-[#e4e6f6] dark:bg-[#262627] text-[#060d22] dark:text-white rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105 shadow-md border border-[#dbd7de] dark:border-white/10"
                        title="Stop generating"
                      >
                        <Icons.Stop />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!message.trim()}
                        className="w-10 h-10 bg-[#060d22] text-[#f2f6fb] dark:bg-white dark:text-[#060d22] rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 shadow-md"
                      >
                        <Icons.Send />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
            <div className="mt-1 mb-1 text-center text-[10px] text-[#2a3343]/80 dark:text-[#adaaab] font-medium tracking-wide">
              FusionAI can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262627;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00F0FF;
        }
      `}} />
    </div>
  );
}
