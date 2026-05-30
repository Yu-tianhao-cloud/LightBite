// frontend/pages/chat.tsx
import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from "react";
import Layout from "@/components/layout/Layout";

/* ================================================================
   Types
   ================================================================ */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number; // timestamp
}

/* ================================================================
   Helpers
   ================================================================ */

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatTime(ts: number): string {
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

const STORAGE_KEY = "lightbite_chat_conversations";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch { /* quota exceeded — silently ignore */ }
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
   Suggestions (empty state)
   ================================================================ */

const SUGGESTIONS = [
  { emoji: "🥗", text: "帮我推荐一份减脂午餐" },
  { emoji: "📊", text: "分析一下我的饮食数据" },
  { emoji: "🍳", text: "鸡胸肉有哪些低卡做法？" },
  { emoji: "📅", text: "帮我制定一周的饮食计划" },
];

function timestamp(): number { return Date.now(); }

function createWelcomeConv(): Conversation {
  return {
    id: genId(),
    title: "新对话",
    messages: [
      {
        role: "assistant" as const,
        content:
          "你好！我是 **LightBite AI 助手** 🥗\n\n我可以帮你：\n- 📋 根据你的口味和营养目标推荐食谱\n- 📊 分析你的饮食数据，给出改进建议\n- 🍳 回答烹饪和营养相关问题\n- 📝 帮你制定个性化的饮食计划\n\n⚠️ 当前为前端演示模式，AI 接口尚未接入。",
      },
    ],
    createdAt: timestamp(),
  };
}

function getInitialState(): { conversations: Conversation[]; activeId: string | null } {
  const saved = loadConversations();
  if (saved.length > 0) {
    return { conversations: saved, activeId: saved[0].id };
  }
  const welcome = createWelcomeConv();
  return { conversations: [welcome], activeId: welcome.id };
}

function simulateReply(userText: string): string {
  return (
    "👋 感谢你的提问！\n\n" +
    "`LightBite AI` 模块正在开发中，当前展示的是前端演示界面。\n\n" +
    "你可以尝试的功能包括：\n- **智能食谱推荐**：输入口味偏好和营养需求\n- **饮食分析**：上传饮食记录获取专业建议\n- **烹饪问答**：任何关于食材、做法的问题\n\n" +
    "```python\n# 后端 API 示例（开发中）\nPOST /api/v1/chat\n{\n  \"message\": \"" +
    truncateTitle(userText, 30) +
    "\",\n  \"history\": [...]\n}\n```\n\n敬请期待！✨"
  );
}

/* ================================================================
   Chat Page
   ================================================================ */

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(() => getInitialState().conversations);
  const [activeId, setActiveId] = useState<string | null>(() => getInitialState().activeId);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Persist ---
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations);
  }, [conversations]);

  // --- Derived ---
  const activeConv = conversations.find((c) => c.id === activeId) || null;

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
  const updateConv = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  // --- Send message ---
  const sendMessage = (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || loading) return;
    if (!overrideText) setInput("");

    let targetId = activeId;

    // If no active conversation, create one
    if (!targetId) {
      const newConv: Conversation = {
        id: genId(),
        title: truncateTitle(trimmed),
        messages: [],
        createdAt: timestamp(),
      };
      setConversations((prev) => [newConv, ...prev]);
      targetId = newConv.id;
      setActiveId(targetId);
    }

    const userMsg: Message = { role: "user", content: trimmed };
    setInput("");

    // Update conversation title if it's the first user message
    updateConv(targetId, (c) => {
      const hasUserMsg = c.messages.some((m) => m.role === "user");
      return {
        ...c,
        title: hasUserMsg ? c.title : truncateTitle(trimmed),
        messages: [...c.messages, userMsg],
      };
    });

    setLoading(true);

    // TODO: replace with real API call
    setTimeout(() => {
      const aiReply: Message = { role: "assistant", content: simulateReply(trimmed) };
      updateConv(targetId!, (c) => ({
        ...c,
        messages: [...c.messages, aiReply],
      }));
      setLoading(false);
    }, 1200);
  };

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
    const conv = createWelcomeConv();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setSidebarOpen(false);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        setActiveId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const switchConversation = (id: string) => {
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
            {conversations.length === 0 && (
              <p className="text-center text-gray-400 text-xs py-8">暂无对话记录</p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  conv.id === activeId
                    ? "bg-primary-light text-primary font-semibold"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                {/* Icon */}
                <span className="text-base shrink-0">
                  {conv.id === activeId ? "💬" : "📝"}
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{conv.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {conv.messages.filter((m) => m.role === "user").length} 条对话 · {formatTime(conv.createdAt)}
                  </p>
                </div>

                {/* Delete button */}
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
              💡 对话记录保存在本地浏览器
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
              {activeConv ? activeConv.title : "AI 助手"}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {!activeConv ? (
              /* Empty state — no conversations */
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-lg font-bold text-gray-700 mb-2">LightBite AI 助手</h2>
                <p className="text-sm text-gray-500 mb-6">点击左侧「新对话」开始聊天</p>
                <button
                  onClick={newConversation}
                  className="bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  ✨ 开始新对话
                </button>
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

                {/* Loading */}
                {loading && activeConv.id === activeId && (
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

          {/* Suggestions bar */}
          {activeConv &&
            activeConv.messages.length === 1 &&
            activeConv.messages[0].role === "assistant" && (
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
          {activeConv && (
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
