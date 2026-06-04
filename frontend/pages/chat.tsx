// frontend/pages/chat.tsx
import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";

const STREAM_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1") + "/chat/send/stream";

/* ================================================================
   Types
   ================================================================ */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  updatedAt: string; // ISO string from backend
}

interface ConvListItem {
  id: number;
  title: string;
  updated_at: string;
  message_count: number;
}

/* ================================================================
   Helpers
   ================================================================ */

function formatTime(iso: string): string {
  const ts = new Date(iso).getTime();
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  return new Date(ts).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function truncateTitle(text: string, max = 20): string {
  const cleaned = text.replace(/\n/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
}

/* ================================================================
   Markdown Renderer
   ================================================================ */

function Markdown({ text }: { text: string }) {
  const segments = text.split(/(```[\s\S]*?```|`[^`]*`|\*\*[^*]+\*\*)/g);

  return (
    <div className="space-y-2 leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.startsWith("```") && seg.endsWith("```")) {
          const code = seg.slice(3, -3).replace(/^\w*\n?/, "");
          return (
            <pre key={i} className="bg-gray-800 text-green-300 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
              <code>{code}</code>
            </pre>
          );
        }
        if (seg.startsWith("`") && seg.endsWith("`")) {
          return (
            <code key={i} className="bg-gray-100 text-accent px-1.5 py-0.5 rounded text-xs font-mono">
              {seg.slice(1, -1)}
            </code>
          );
        }
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return <strong key={i} className="font-bold text-gray-800">{seg.slice(2, -2)}</strong>;
        }
        return (
          <span key={i}>
            {seg.split("\n").map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line.startsWith("- ") ? (
                  <span className="flex items-start gap-2 ml-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>{line.slice(2)}</span>
                  </span>
                ) : line.match(/^\d+\.\s/) ? (
                  <span className="flex items-start gap-2 ml-2">
                    <span className="text-primary shrink-0 font-semibold">{line.match(/^\d+/)?.[0]}.</span>
                    <span>{line.replace(/^\d+\.\s/, "")}</span>
                  </span>
                ) : (
                  line
                )}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
}

/* ================================================================
   Suggestions
   ================================================================ */

const SUGGESTIONS = [
  { emoji: "🥗", text: "帮我推荐一份减脂午餐" },
  { emoji: "📊", text: "分析一下我的饮食数据" },
  { emoji: "🍳", text: "鸡胸肉有哪些低卡做法？" },
  { emoji: "📅", text: "帮我制定一周的饮食计划" },
];

/* ================================================================
   Chat Page
   ================================================================ */

export default function ChatPage() {
  const [convList, setConvList] = useState<ConvListItem[]>([]);       // sidebar metadata
  const [conversations, setConversations] = useState<Conversation[]>([]); // loaded messages
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tempIdCounter = useRef(0);

  // --- Load conversation list on mount ---
  useEffect(() => {
    api.get("/chat/conversations")
      .then((data) => {
        const items: ConvListItem[] = Array.isArray(data) ? data : (data.items || []);
        setConvList(items);
        if (items.length > 0) {
          setActiveId(items[0].id);
        }
      })
      .catch(() => { /* backend may not be ready yet */ })
      .finally(() => setListLoading(false));
  }, []);

  // --- Load messages when switching conversations ---
  useEffect(() => {
    if (activeId === null) return;

    // Already loaded?
    const existing = conversations.find((c) => c.id === activeId);
    if (existing) return;

    api.get(`/chat/conversations/${activeId}`)
      .then((data) => {
        // Backend returns array of messages directly
        const messages: Message[] = Array.isArray(data) ? data : (data.messages || []);
        const meta = convList.find((c) => c.id === activeId);
        const conv: Conversation = {
          id: activeId,
          title: meta?.title || "对话",
          messages,
          updatedAt: meta?.updated_at || new Date().toISOString(),
        };
        setConversations((prev) => [...prev, conv]);
      })
      .catch(() => { /* ignore */ });
  }, [activeId, convList]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Derived ---
  const activeConv = conversations.find((c) => c.id === activeId) || null;
  const activeMeta = convList.find((c) => c.id === activeId) || null;

  // --- Auto-scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, loading]);

  // --- Auto-resize textarea ---
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  // --- Update conversation helper ---
  const updateConv = useCallback((id: number, fn: (c: Conversation) => Conversation) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === id);
      if (exists) {
        return prev.map((c) => (c.id === id ? fn(c) : c));
      }
      // If not loaded yet, create from convList metadata
      const meta = convList.find((c) => c.id === id);
      if (meta) {
        const newConv: Conversation = { id: meta.id, title: meta.title, messages: [], updatedAt: meta.updated_at };
        return [...prev, fn(newConv)];
      }
      return prev;
    });
  }, [convList]);

  // --- Refs for stream-internal mutable state ---
  const abortRef = useRef<AbortController | null>(null);
  const streamRef = useRef({ content: "", realConvId: null as number | null, streamTitle: null as string | null, targetId: 0, tempId: null as number | null });

  // --- Send message (SSE streaming) ---
  const sendMessage = useCallback(async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || loading) return;
    if (!overrideText) setInput("");

    // Cancel any in-flight stream
    if (abortRef.current) abortRef.current.abort();

    const userMsg: Message = { role: "user", content: trimmed };
    const s = streamRef.current;
    s.content = "";
    s.realConvId = null;
    s.streamTitle = null;

    // New conversation → create temp local conversation so the message is visible immediately
    s.tempId = null;
    if (!activeId) {
      s.tempId = --tempIdCounter.current;
      setConversations((prev) => [
        { id: s.tempId!, title: truncateTitle(trimmed), messages: [userMsg], updatedAt: new Date().toISOString() },
        ...prev,
      ]);
      setActiveId(s.tempId);
    } else {
      updateConv(activeId, (c) => ({
        ...c,
        title: c.messages.some((m) => m.role === "user") ? c.title : truncateTitle(trimmed),
        messages: [...c.messages, userMsg],
      }));
      setConvList((prev) => prev.map((c) => (c.id === activeId ? { ...c, updated_at: new Date().toISOString() } : c)));
    }

    s.targetId = activeId || s.tempId!;

    setLoading(true);
    // AI bubble is added lazily when first chunk arrives — no empty placeholder

    // ---- SSE stream ----
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(STREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversation_id: activeId && activeId > 0 ? activeId : null,
          message: trimmed,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "请求失败" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            switch (data.type) {
              case "meta":
                s.realConvId = data.conversation_id;
                s.streamTitle = data.title || null;
                break;
              case "chunk":
                s.content += data.content;
                updateConv(s.targetId, (c) => {
                  const msgs = [...c.messages];
                  const last = msgs[msgs.length - 1];
                  if (last && last.role === "assistant") {
                    // Update existing AI bubble
                    msgs[msgs.length - 1] = { ...last, content: s.content };
                  } else {
                    // First chunk — create the AI bubble
                    msgs.push({ role: "assistant", content: s.content });
                  }
                  return { ...c, messages: msgs };
                });
                break;
              case "done":
                break;
            }
          } catch { /* skip malformed JSON */ }
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === "AbortError") {
        setLoading(false);
        return;
      }
      s.content = "😅 抱歉，消息发送失败了：" + (e.message || "未知错误") + "\n\n请检查后端服务是否启动。";
      updateConv(s.targetId, (c) => {
        const msgs = [...c.messages];
        msgs[msgs.length - 1] = { role: "assistant", content: s.content };
        return { ...c, messages: msgs };
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }

    // ---- Post-stream: reconcile temp conversation → real ----
    if (s.tempId && s.realConvId) {
      const finalTitle = s.streamTitle || truncateTitle(trimmed);
      const finalAiMsg: Message = { role: "assistant", content: s.content };

      setConversations((prev) => [
        { id: s.realConvId!, title: finalTitle, messages: [userMsg, finalAiMsg], updatedAt: new Date().toISOString() },
        ...prev.filter((c) => c.id !== s.tempId),
      ]);
      setConvList((prev) => [
        { id: s.realConvId!, title: finalTitle, updated_at: new Date().toISOString(), message_count: 2 },
        ...prev,
      ]);
      setActiveId(s.realConvId);
    } else if (s.realConvId) {
      if (s.streamTitle) {
        setConvList((prev) => prev.map((c) => (c.id === s.realConvId ? { ...c, title: s.streamTitle! } : c)));
      }
    }
  }, [activeId, input, loading, updateConv]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Conversation actions ---
  const newConversation = () => {
    setActiveId(null);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id: number) => {
    // Optimistic removal
    setConvList((prev) => prev.filter((c) => c.id !== id));
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) {
      setConvList((prev) => {
        const nextId = prev.length > 0 ? prev[0].id : null;
        setActiveId(nextId);
        return prev;
      });
    }

    try {
      await api.delete(`/chat/conversations/${id}`);
    } catch {
      // Revert on failure — reload the list
      const data = await api.get("/chat/conversations").catch(() => null);
      const list = Array.isArray(data) ? data : (data?.items || []);
      if (list.length > 0) setConvList(list);
    }
  };

  const switchConversation = (id: number) => {
    setActiveId(id);
    setSidebarOpen(false);
  };

  /* ================================================================
     Render
     ================================================================ */

  return (
    <Layout>
      <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
        {/* ============ Mobile overlay ============ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ============ Sidebar ============ */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* New conversation button */}
          <div className="p-4">
            <button
              onClick={newConversation}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新对话
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {listLoading && (
              <p className="text-center text-gray-400 text-xs py-8">加载中...</p>
            )}
            {!listLoading && convList.length === 0 && (
              <p className="text-center text-gray-400 text-xs py-8">暂无对话记录</p>
            )}
            {convList.map((conv) => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  conv.id === activeId
                    ? "bg-primary-light text-primary font-semibold"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <span className="text-base shrink-0">
                  {conv.id === activeId ? "💬" : "📝"}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{conv.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {conv.message_count} 条对话 · {formatTime(conv.updated_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                  aria-label="删除对话"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 text-center">
              💡 对话记录保存在云端
            </p>
          </div>
        </aside>

        {/* ============ Main Chat Area ============ */}
        <div className="flex-1 flex flex-col min-w-0 bg-green-50/20">
          {/* Mobile header bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-white">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-primary transition-colors p-1"
              aria-label="打开侧边栏"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 truncate">
              {activeConv ? activeConv.title : activeMeta ? activeMeta.title : "AI 助手"}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {!activeId ? (
              /* Empty state — no conversations or creating new */
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-lg font-bold text-gray-700 mb-2">LightBite AI 助手</h2>
                <p className="text-sm text-gray-500 mb-6">
                  {convList.length === 0 ? "发送消息开始你的第一段对话" : "点击左侧对话或开始新对话"}
                </p>
                {convList.length > 0 && (
                  <button
                    onClick={newConversation}
                    className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
                  >
                    ✨ 开始新对话
                  </button>
                )}
              </div>
            ) : !activeConv ? (
              /* Loading messages */
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">加载消息中...</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {activeConv.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-primary flex items-center justify-center text-white text-sm shrink-0 mt-0.5">
                        🤖
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <Markdown text={msg.content} />
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm shrink-0 mt-0.5">
                        U
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading — only show if no AI bubble is streaming yet */}
                {loading && activeId && activeConv && activeConv.messages[activeConv.messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-primary flex items-center justify-center text-white text-sm shrink-0">
                      🤖
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md shadow-sm px-5 py-4">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggestions bar — only for new conversation with no messages yet */}
          {!activeId && (
            <div className="max-w-3xl mx-auto w-full px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="text-left bg-white rounded-xl border border-green-100 px-4 py-3 text-sm text-gray-600 hover:bg-green-50 hover:border-green-200 transition-all flex items-center gap-2"
                  >
                    <span className="text-lg shrink-0">{s.emoji}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-100 bg-white">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-3 flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
                rows={1}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-all disabled:opacity-40 active:scale-95 shrink-0"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
