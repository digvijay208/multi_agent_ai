'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

// Icons (Inline SVGs to replace Emojis)
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
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  ),
  Attach: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
  ),
  Mic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
  ),
  Avatar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  )
};

export default function ModernChatInterface() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading, isImageLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const lowerQuery = message.toLowerCase();
    const imageKeywords = ['generate image', 'create image', 'draw', 'generate picture', 'create picture', 'generate photo', 'create photo', 'make image', 'make picture', 'generate an image', 'create an image', 'draw an image', 'generate a picture', 'create a picture'];
    const wantsImage = imageKeywords.some(keyword => lowerQuery.includes(keyword));

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
    setIsImageLoading(wantsImage);

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
      setIsImageLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-[#0e0e0f] text-white font-sans selection:bg-[#00F0FF]/30 overflow-hidden">
      <aside className="w-72 flex-shrink-0 flex flex-col bg-[#131314] z-10 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-10 group cursor-pointer">
            <div className="w-12 h-12 bg-[#201f21] flex items-center justify-center rounded-2xl shadow-[0_0_15px_rgba(0,240,255,0.05)] transition-all duration-500 group-hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] text-[#00F0FF]">
              <Icons.Logo />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">FusionAI</h1>
              <p className="text-xs text-[#adaaab] font-medium tracking-wide">OBSIDIAN NEXUS</p>
            </div>
          </div>

          <button
            onClick={() => setChatHistory([])}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-[#00eefc] text-[#003f43] text-sm font-semibold mb-8 transition-all duration-500 ease-out hover:bg-[#00deec] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <Icons.Plus />
            New Thread
          </button>

          <nav className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#262627] text-[#00F0FF] cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <Icons.MessageCircle />
              <span className="text-sm font-medium tracking-tight">Active Context</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#adaaab] cursor-pointer transition-colors duration-300 hover:bg-[#201f21] hover:text-white">
              <Icons.History />
              <span className="text-sm tracking-tight">Session History</span>
            </div>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="px-4 py-4 rounded-3xl bg-gradient-to-br from-[#00F0FF]/10 to-[#7000ff]/10 border border-white/5 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00F0FF]/20 blur-[30px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#131314] flex items-center justify-center border border-white/10 text-white shadow-lg">
                <Icons.Avatar />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Enterprise User</p>
                <p className="text-[10px] text-[#00F0FF] tracking-wide font-medium">NVIDIA NIM LINK</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#0e0e0f] relative overflow-hidden min-h-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#7000ff]/5 blur-[120px] rounded-full pointer-events-none" />

        <header className="h-20 shrink-0 flex items-center justify-between px-10 relative z-10 backdrop-blur-xl bg-[#0e0e0f]/60">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-[#adaaab] tracking-tight">
              Session: <span className="text-white">{chatHistory.length > 0 ? 'Synthesizing Answers' : 'Initiated'}</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#7000ff]/20 text-[#ac89ff] uppercase tracking-wider border border-[#7000ff]/30 text-shadow-sm">
              Tri-Agent Mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[11px] font-semibold text-[#adaaab] hover:text-[#00F0FF] transition-all duration-300 flex items-center gap-2">
              <Icons.Settings /> Options
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pb-36 relative z-10 scroll-smooth">
          <div className="max-w-4xl mx-auto pt-10">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-32 opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
                <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF] to-[#7000ff] rounded-3xl blur-[20px] opacity-20" />
                  <div className="w-24 h-24 bg-[#131314] rounded-3xl flex items-center justify-center relative z-10 border border-white/5 shadow-2xl text-[#00F0FF]">
                    <Icons.Logo />
                  </div>
                </div>
                <h3 className="text-4xl font-extrabold mb-3 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-[#adaaab]">
                  What shall we resolve today?
                </h3>
                <p className="text-base text-[#adaaab] font-medium tracking-tight">
                  Interact with the combined intelligence of GPT-OSS and Gemma.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {chatHistory.map((msg, idx) => {
                  const isImageResponse = msg.role === 'assistant' && (msg.content.includes('![') || msg.content.includes('data:image/'));
                  
                  return (
                  <div key={idx} className="group">
                    {msg.role === 'user' ? (
                      <div className="flex justify-end pt-4">
                        <div className="max-w-[75%] bg-[#201f21] border border-white/[0.03] px-6 py-4 rounded-3xl rounded-tr-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                          <p className="text-base text-white leading-relaxed tracking-tight">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5 animate-[fadeIn_0.5s_ease-out_forwards]">
                        <div className={`flex items-center gap-4 ${isImageResponse ? 'hidden' : ''}`}>
                          <div className="w-10 h-10 bg-gradient-to-br from-[#00F0FF]/20 to-[#7000ff]/20 flex items-center justify-center rounded-xl border border-[#00F0FF]/20 shadow-[0_0_15px_rgba(0,240,255,0.1)] text-[#00F0FF]">
                            <Icons.Logo />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-widest text-[#00F0FF] mb-1">
                              Fusion Insight
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#adaaab] font-medium tracking-wide">Consensus derived from:</span>
                              <div className="flex gap-1.5">
                                <span className="text-[10px] bg-[#262627] text-white px-2 py-0.5 rounded border border-white/5 shadow-sm">GPT-OSS</span>
                                <span className="text-[10px] bg-[#262627] text-white px-2 py-0.5 rounded border border-white/5 shadow-sm">Gemma 3N</span>
                                <span className="text-[10px] bg-[#262627] text-white px-2 py-0.5 rounded border border-white/5 shadow-sm">Flux.2</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={isImageResponse ? "" : "relative p-8 rounded-3xl bg-[#131314] overflow-hidden group-hover:bg-[#1a191b] transition-colors duration-500"}>
                          {!isImageResponse && (
                            <>
                              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent" />
                              <div className="absolute top-6 right-6">
                                <div className="px-3 py-1 bg-[#262627] border border-white/5 shadow-lg text-[10px] font-bold text-[#adaaab] rounded-full flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full drop-shadow-[0_0_5px_rgba(0,240,255,1)]"></span> Verified
                                </div>
                              </div>
                            </>
                          )}

                          <div className={`prose prose-invert prose-p:leading-relaxed prose-p:tracking-tight max-w-none text-[15px] prose-pre:bg-[#0e0e0f] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-img:rounded-2xl prose-img:border prose-img:border-white/5 prose-img:shadow-lg prose-img:mt-4 prose-img:max-h-[500px] prose-img:object-contain ${isImageResponse ? 'prose-p:text-[#adaaab]' : ''}`}>
                            <ReactMarkdown
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
                );})}
              </div>
            )}

            {loading && (
              <div className="space-y-5 animate-[fadeIn_0.5s_ease-out_forwards] mt-12">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#262627] flex items-center justify-center rounded-xl border border-[#ff59e3]/30 shadow-[0_0_15px_rgba(255,89,227,0.2)] animate-pulse text-[#ff59e3]">
                     <Icons.Logo />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[#ff59e3] mb-1 flex items-center gap-2">
                      {isImageLoading ? 'Generating Masterpiece' : 'Synthesizing Response'} <span className="flex gap-1 animate-pulse"><span className="w-1 h-1 bg-[#ff59e3] rounded-full"></span><span className="w-1 h-1 bg-[#ff59e3] rounded-full"></span><span className="w-1 h-1 bg-[#ff59e3] rounded-full"></span></span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#adaaab]">{isImageLoading ? 'Active Engine:' : 'Active Agents:'}</span>
                      <div className="flex gap-1.5">
                        {!isImageLoading && <span className="text-[10px] bg-[#7000ff]/20 text-[#dac9ff] px-2 py-0.5 rounded border border-[#7000ff]/30 shadow-[0_0_10px_rgba(112,0,255,0.2)]">GPT-OSS</span>}
                        {!isImageLoading && <span className="text-[10px] bg-[#00F0FF]/10 text-[#00F0FF] px-2 py-0.5 rounded border border-[#00F0FF]/20">Gemma 3N</span>}
                        {isImageLoading && <span className="text-[10px] bg-[#ff59e3]/10 text-[#ff59e3] px-2 py-0.5 rounded border border-[#ff59e3]/20">Flux.2 Klein</span>}
                      </div>
                    </div>
                  </div>
                </div>
                {isImageLoading ? (
                  <div className="relative w-full h-[300px] rounded-3xl bg-[#131314] overflow-hidden border border-white/5 flex flex-col items-center justify-center gap-4 shadow-lg group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#ff59e3]/10 via-transparent to-[#00F0FF]/10 animate-pulse opacity-50"></div>
                    <div className="w-full h-full relative z-10 flex flex-col items-center justify-center px-10 text-center">
                       <Icons.Logo />
                       <div className="mt-4 text-[#adaaab] text-sm font-medium tracking-wide animate-pulse">Initializing Diffusion Pipeline...</div>
                       <div className="w-2/3 h-1 bg-[#262627] rounded-full mt-6 overflow-hidden">
                         <div className="h-full bg-gradient-to-r from-[#00F0FF] to-[#ff59e3] w-1/2 animate-[pulse_1s_ease-in-out_infinite] blur-[1px]"></div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative p-8 rounded-3xl bg-[#131314] opacity-50">
                    <div className="h-3 w-3/4 bg-[#262627] rounded-full mb-4 animate-pulse"></div>
                    <div className="h-3 w-1/2 bg-[#262627] rounded-full mb-4 animate-pulse"></div>
                    <div className="h-3 w-full bg-[#262627] rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} className="h-40" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full pt-8 pb-3 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto px-4">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="bg-[#2f2f2f]/80 border border-white/5 rounded-full p-2 shadow-2xl backdrop-blur-3xl transition-all duration-500 hover:bg-[#2f2f2f] focus-within:bg-[#2f2f2f]">
                <div className="flex items-center gap-2">
                  <button type="button" className="p-3 text-[#adaaab] hover:text-white transition-colors rounded-full hover:bg-white/5 ml-1">
                    <Icons.Attach />
                  </button>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 text-[15px] py-3.5 px-2 resize-none placeholder-[#adaaab]/70 max-h-[200px] outline-none text-white tracking-tight leading-relaxed font-medium"
                    placeholder="Ask the collective intelligence... (Shift + Enter for new line)"
                    rows={1}
                    disabled={loading}
                    style={{ minHeight: '52px' }}
                  />
                  <div className="flex items-center gap-1 pr-2">
                    <button type="button" className="p-3 text-[#adaaab] hover:text-white transition-colors rounded-full hover:bg-white/5 mr-1">
                      <Icons.Mic />
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !message.trim()}
                      className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 shadow-md"
                    >
                      <Icons.Send />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="mt-2 text-center text-[10px] text-[#adaaab] font-medium tracking-wide">
              Obsidian Engine can make mistakes. Check important information.
            </div>
          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
