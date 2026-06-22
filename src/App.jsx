import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ── helpers ──────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function generateTempId() {
  return crypto.randomUUID();
}

// ── session bootstrap ─────────────────────────────────────────────────────────
async function bootstrapUser() {
  let userId = localStorage.getItem("userId");
  if (userId) {
    try {
      await apiFetch(`/users/${userId}`);
      return userId;
    } catch (e) {
      if (e.status !== 404) throw e;
    }
  }
  userId = generateTempId();
  const data = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  const newId = data.userId || data.id || userId;
  localStorage.setItem("userId", newId);
  return newId;
}

// ── icons ─────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const LinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
  </svg>
);

// ── thinking cycle label ──────────────────────────────────────────────────────
const THINKING_LABELS = [
 "Thinking",
 "Searching"
];

function TypingIndicator() {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLabelIndex(i => (i + 1) % THINKING_LABELS.length);
    }, 2200);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="thinking-indicator">
      <div className="thinking-spinner" />
      <span>{THINKING_LABELS[labelIndex]}</span>
    </div>
  );
}

// ── stock chart ───────────────────────────────────────────────────────────────
const CHART_TABS = [
  { key: "tenDay", label: "10D" },
  { key: "fifteenDay", label: "15D" },
  { key: "thirtyDay", label: "30D" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function StockChart({ chart }) {
  const [activeTab, setActiveTab] = useState("tenDay");

  if (!chart || !chart.chartData) return null;

  const data = chart.chartData[activeTab] || [];
  const prices = data.map(d => d.close).filter(Boolean);
  const isUp = prices.length >= 2 ? prices[prices.length - 1] >= prices[0] : true;
  const color = isUp ? "#10B981" : "#EF4444";

  const firstClose = prices[0];
  const lastClose = prices[prices.length - 1];
  const pctChange = firstClose ? (((lastClose - firstClose) / firstClose) * 100).toFixed(2) : null;

  const chartData = data.map(d => ({
    ...d,
    date: formatDate(d.date),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-date">{payload[0]?.payload?.date}</div>
        <div className="chart-tooltip-price">₹{Number(payload[0]?.value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    );
  };

  return (
    <div className="stock-chart-card">
      <div className="chart-header">
        <div className="chart-ticker-group">
          <ChartIcon />
          <span className="chart-ticker">{chart.ticker}</span>
          <span className="chart-company">{chart.companyName}</span>
        </div>
        {pctChange && (
          <span className={`chart-change ${isUp ? "up" : "down"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(pctChange)}%
          </span>
        )}
      </div>
      <div className="chart-tabs">
        {CHART_TABS.map(t => (
          <button
            key={t.key}
            className={`chart-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="chart-body">
        {chartData.length === 0 ? (
          <div className="chart-no-data">No data available for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "Inter, sans-serif" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={v => `₹${v.toLocaleString("en-IN")}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={1.8}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: "#0A0F1E", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── sources ───────────────────────────────────────────────────────────────────
function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="sources-section">
      <span className="sources-label">Sources</span>
      <div className="sources-list">
        {sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-pill">
            <span className="source-dot">{i + 1}</span>
            <span className="source-title">{s.title}</span>
            <LinkIcon />
          </a>
        ))}
      </div>
    </div>
  );
}

// ── message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onFollowUp }) {
  const isUser = msg.role === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "bot-row"}`}>
      {!isUser && (
        <div className="bot-avatar">
          <SparkleIcon />
        </div>
      )}
      <div className={`bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
        {msg.fromCache && (
          <span className="cache-badge">Cached response</span>
        )}

        {isUser ? (
          <div className="bubble-text user-text">{msg.content}</div>
        ) : (
          <div className="bubble-text markdown-body">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}

        {msg.standaloneQuery && (
          <div className="standalone-query">
            <span className="standalone-label">Interpreted as:</span>
            <em>{msg.standaloneQuery}</em>
          </div>
        )}

        {msg.chart && <StockChart chart={msg.chart} />}

        {msg.sources && <Sources sources={msg.sources} />}

        {msg.followUps && msg.followUps.length > 0 && (
          <div className="follow-up-section">
            <span className="follow-up-label">Related questions</span>
            <div className="follow-up-chips">
              {msg.followUps.map((fu, i) => (
                <button key={i} className="chip" onClick={() => onFollowUp(fu)}>
                  {fu}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── sidebar item ──────────────────────────────────────────────────────────────
function SidebarItem({ conv, active, onClick }) {
  const date = conv.updatedAt
    ? new Date(conv.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    : "";
  return (
    <button className={`sidebar-item ${active ? "active" : ""}`} onClick={onClick}>
      <div className="sidebar-item-inner">
        <span className="sidebar-item-dot" />
        <div className="sidebar-item-content">
          <span className="sidebar-item-title">{conv.title || "New conversation"}</span>
          {date && <span className="sidebar-item-date">{date}</span>}
        </div>
      </div>
    </button>
  );
}

// ── empty state prompts ───────────────────────────────────────────────────────
const STARTER_PROMPTS = [
  { label: "Tata Motors FY27 outlook", sub: "Earnings · Guidance" },
  { label: "Top gainers in Nifty 50 today", sub: "Market · Movers" },
  { label: "HDFC Bank Q4 results analysis", sub: "Results · Banking" },
  { label: "Gold vs equities this year", sub: "Macro · Allocation" },
];

// ── main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [userId, setUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const activeConvIdRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  // auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  // ── bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const uid = await bootstrapUser();
        setUserId(uid);
        const convs = await apiFetch(`/conversations?userId=${uid}`);
        setConversations(Array.isArray(convs) ? convs : convs.conversations || []);
      } catch (e) {
        setError("Could not connect to the server. Please verify your API URL.");
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  // ── auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const isNewConv = !activeConvIdRef.current;
      const body = { query: text, userId };
      if (!isNewConv) body.conversationId = activeConvIdRef.current;

      const data = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const convId = data.conversationId;
      if (convId && !activeConvIdRef.current) {
        setActiveConvId(convId);
        const convs = await apiFetch(`/conversations?userId=${userId}`);
        setConversations(Array.isArray(convs) ? convs : convs.conversations || []);
      }

      const botMsg = {
        role: "assistant",
        content: data.answer || data.response || data.message || JSON.stringify(data),
        followUps: data.followUps || [],
        fromCache: data.fromCache || false,
        standaloneQuery: null,
        chart: data.chart || null,
        sources: data.sources || [],
        id: Date.now() + 1,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, userId]);

  // ── follow-up ────────────────────────────────────────────────────────────────
  const sendFollowUp = useCallback(async (chipText) => {
    if (loading) return;
    setError(null);

    const userMsg = { role: "user", content: chipText, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await apiFetch("/chat/follow_up", {
        method: "POST",
        body: JSON.stringify({
          query: chipText,
          conversationId: activeConvIdRef.current,
          userId,
        }),
      });

      const botMsg = {
        role: "assistant",
        content: data.answer || data.response || data.message || JSON.stringify(data),
        followUps: data.followUps || [],
        fromCache: data.fromCache || false,
        standaloneQuery: data.standaloneQuery || null,
        chart: data.chart || null,
        sources: data.sources || [],
        id: Date.now() + 1,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, userId]);

  // ── load conversation ────────────────────────────────────────────────────────
  const loadConversation = useCallback(async (conv) => {
    if (conv.id === activeConvId) return;
    setActiveConvId(conv.id);
    setMessages([]);
    setLoading(true);
    try {
      const data = await apiFetch(`/conversations/${conv.id}?userId=${userId}`);
      const msgs = data.messages || data.history || [];
      setMessages(msgs.map((m, i) => ({
        role: m.role,
        content: m.content || m.text,
        followUps: m.followUps || [],
        fromCache: m.fromCache || false,
        standaloneQuery: m.standaloneQuery || null,
        chart: m.chart || null,
        sources: m.sources || [],
        id: i,
      })));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeConvId, userId]);

  // ── new conversation ─────────────────────────────────────────────────────────
  const newConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── splash ───────────────────────────────────────────────────────────────────
  if (bootstrapping) {
    return (
      <div className="splash">
        <div className="splash-inner">
          <div className="splash-ring">
            <div className="splash-logo">◈</div>
          </div>
          <p className="splash-label">Initialising</p>
        </div>
      </div>
    );
  }

  const activeTitle = activeConvId
    ? (conversations.find(c => c.id === activeConvId)?.title || "Conversation")
    : null;

  return (
    <div className="app-shell">
      {/* sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <>
              <div className="sidebar-brand">
                <span className="brand-mark">◈</span>
                <span className="brand-text">Finara</span>
              </div>
              <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Collapse">
                <MenuIcon />
              </button>
            </>
          ) : (
            <button className="icon-btn sidebar-expand" onClick={() => setSidebarOpen(true)} title="Expand">
              <MenuIcon />
            </button>
          )}
        </div>

        {sidebarOpen && (
          <>
            <div className="sidebar-action">
              <button className="new-chat-btn" onClick={newConversation}>
                <PlusIcon />
                <span>New conversation</span>
              </button>
            </div>

            <div className="sidebar-section-label">Recent</div>

            <div className="sidebar-list">
              {conversations.length === 0 ? (
                <p className="sidebar-empty">No conversations yet</p>
              ) : (
                conversations.map(c => (
                  <SidebarItem
                    key={c.id}
                    conv={c}
                    active={c.id === activeConvId}
                    onClick={() => loadConversation(c)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </aside>

      {/* main */}
      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-header-left">
            {!sidebarOpen && (
              <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
                <MenuIcon />
              </button>
            )}
            {activeTitle ? (
              <span className="chat-title">{activeTitle}</span>
            ) : (
              <span className="chat-title muted">New conversation</span>
            )}
          </div>
          <button className="new-chat-btn-header" onClick={newConversation}>
            <PlusIcon /> New
          </button>
        </header>

        <div className="messages-area">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-orb">
                <div className="orb-ring" />
                <span className="orb-mark">◈</span>
              </div>
              <h2 className="empty-heading">What are the markets telling you?</h2>
              <p className="empty-sub">Ask about earnings, sectors, macro trends, or any listed company — in plain language.</p>
              <div className="starter-grid">
                {STARTER_PROMPTS.map((s, i) => (
                  <button
                    key={s.label}
                    className="starter-card"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => sendMessage(s.label)}
                  >
                    <div className="starter-card-body">
                      <span className="starter-label">{s.label}</span>
                      <span className="starter-sub">{s.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onFollowUp={sendFollowUp} />
          ))}

          {loading && (
            <div className="message-row bot-row">
              <div className="bot-avatar loading-avatar">
                <SparkleIcon />
              </div>
              <div className="bubble bot-bubble">
                <TypingIndicator />
              </div>
            </div>
          )}

          {error && (
            <div className="error-toast">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <div className="input-box" ref={inputRef}>
            <textarea
              ref={textareaRef}
              className="chat-input"
              rows={1}
              placeholder="Ask about a stock, sector, or market event…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              title="Send"
            >
              <SendIcon />
            </button>
          </div>
          <p className="input-hint">Return to send · Shift + Return for a new line</p>
        </div>
      </main>
    </div>
  );
}