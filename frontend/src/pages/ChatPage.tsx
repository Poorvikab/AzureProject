import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';

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
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] max-w-3xl w-full mx-auto px-4 sm:px-6">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-base font-medium text-zinc-300 mb-1">
              Ask Grounded Questions
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm">
              Type a question below to query the documents and images uploaded to your knowledge base.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-100 text-zinc-900 font-normal'
                    : msg.error
                    ? 'bg-zinc-900 border border-red-900/60 text-red-300'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                }`}
              >
                {msg.error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Error query response</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounded Sources Cited */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-800 text-xs">
                    <div className="text-zinc-400 font-medium mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Cited Sources ({msg.sources.length})</span>
                    </div>

                    <div className="space-y-2">
                      {msg.sources.map((src, idx) => {
                        const key = `${msg.id}-${idx}`;
                        const isExpanded = expandedSources[key];
                        return (
                          <div
                            key={idx}
                            className="bg-zinc-950/70 border border-zinc-800/80 rounded p-2.5"
                          >
                            <button
                              type="button"
                              onClick={() => toggleSource(msg.id, idx)}
                              className="w-full flex items-center justify-between text-left text-zinc-300 hover:text-zinc-100 transition-colors"
                            >
                              <span className="font-medium truncate pr-2">
                                {src.filename || `Source ${idx + 1}`}
                                {src.page ? ` (Page ${src.page})` : ''}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              )}
                            </button>

                            {isExpanded && src.content && (
                              <p className="mt-2 text-zinc-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border-t border-zinc-800/60 pt-2">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-xs text-zinc-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              <span>Querying knowledge base...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="py-4 border-t border-zinc-800 bg-zinc-950">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isSending}
            placeholder="Ask a question about your uploaded media..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!question.trim() || isSending}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
