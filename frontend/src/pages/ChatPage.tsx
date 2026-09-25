import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { apiClient, getCurrentUserId, getErrorMessage } from '../api/client';

interface SourceItem {
  filename?: string;
  content?: string;
  page?: number | string;
  [key: string]: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: SourceItem[];
  error?: boolean;
}

function extractSources(data: any): SourceItem[] {
  const rawSources = data.sources || data.source_documents || data.references || data.chunks;
  if (!Array.isArray(rawSources)) return [];

  return rawSources.map((s: any) => {
    if (typeof s === 'string') {
      return { content: s };
    }
    const filename = s.filename || s.file_name || s.name || s.document || s.metadata?.source || s.metadata?.filename;
    const content = s.content || s.text || s.snippet || s.page_content;
    const page = s.page || s.page_number || s.metadata?.page;

    return {
      filename: filename || 'Source file',
      content: typeof content === 'string' ? content : (content ? JSON.stringify(content) : undefined),
      page,
      ...s,
    };
  });
}

function extractAnswer(data: any): string {
  if (typeof data === 'string') return data;
  if (typeof data.answer === 'string') return data.answer;
  if (typeof data.text === 'string') return data.text;
  if (typeof data.response === 'string') return data.response;
  if (typeof data.output === 'string') return data.output;
  if (typeof data.message === 'string') return data.message;
  return JSON.stringify(data);
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const toggleSource = (msgId: string, idx: number) => {
    const key = `${msgId}-${idx}`;
    setExpandedSources((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsSending(true);

    try {
      const response = await apiClient.post('/api/chat/query', {
        question: trimmed,
        user_id: getCurrentUserId() || 'demo-user',
      });

      const data = response.data;
      const answerText = extractAnswer(data);
      const sources = extractSources(data);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: answerText,
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      const errorResponse: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: errorMessage,
        error: true,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="page-shell">
      <div className="page-shell-inner max-w-4xl py-8 sm:py-10">
        <div className="glass-panel p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="kicker">Grounded chat</div>
              <h1 className="mt-3 text-2xl font-semibold text-white">Ask about your uploaded materials</h1>
            </div>
          </div>

          <div className="flex h-[60vh] min-h-[430px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/35">
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center px-4">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Ask grounded questions</h2>
                  <p className="mt-2 max-w-md text-sm text-slate-300">
                    Type a question below to query the documents and images uploaded to your knowledge base.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[80%] ${
                        msg.role === 'user'
                          ? 'chat-bubble-user'
                          : msg.error
                            ? 'chat-bubble-error'
                            : 'chat-bubble-assistant'
                      }`}
                    >
                      {msg.error && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-rose-200">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Error query response</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 border-t border-white/10 pt-3 text-xs">
                          <div className="mb-2 flex items-center gap-1.5 text-slate-300">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Cited Sources ({msg.sources.length})</span>
                          </div>

                          <div className="space-y-2">
                            {msg.sources.map((src, idx) => {
                              const key = `${msg.id}-${idx}`;
                              const isExpanded = expandedSources[key];
                              return (
                                <div key={idx} className="rounded-xl border border-white/10 bg-slate-950/60 p-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleSource(msg.id, idx)}
                                    className="flex w-full items-center justify-between gap-2 text-left text-slate-200 hover:text-white"
                                  >
                                    <span className="truncate pr-2 font-medium">
                                      {src.filename || `Source ${idx + 1}`}
                                      {src.page ? ` (Page ${src.page})` : ''}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                  </button>

                                  {isExpanded && src.content && (
                                    <p className="mt-2 whitespace-pre-wrap border-t border-white/10 pt-2 font-mono text-[11px] leading-relaxed text-slate-300">
                                      {src.content}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isSending && (
                <div className="flex items-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-xs text-slate-200">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-200" />
                    <span>Querying knowledge base...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 bg-slate-950/40 p-3 sm:p-4">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isSending}
                  placeholder="Ask a question about your uploaded media..."
                  className="field-input flex-1"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || isSending}
                  className="primary-button max-w-[150px]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
