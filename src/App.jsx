import { useCallback, useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function generateTempId() {
  return crypto.randomUUID();
}

async function bootstrapUser() {
  let userId = localStorage.getItem("userId");

  if (userId) {
    try {
      await apiFetch(`/users/${userId}`);
      return userId;
    } catch (error) {
      if (error.status !== 404) throw error;
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

function getInitialSidebarOpen() {
  if (typeof window === "undefined") return true;
  const savedState = window.localStorage.getItem("finara:sidebar-open");
  if (savedState !== null) return savedState === "true";
  return window.innerWidth >= 980;
}

function getInitialMobileState() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 980;
}

function formatChartDate(dateString) {
  const value = new Date(dateString);
  return value.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatMessageTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatConversationDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getSourceDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

const STARTER_PROMPTS = [
  { label: "Tata Motors FY27 outlook", sub: "Earnings / Guidance" },
  { label: "Top gainers in Nifty 50 today", sub: "Market / Movers" },
  { label: "HDFC Bank Q4 results analysis", sub: "Results / Banking" },
  { label: "Gold vs equities this year", sub: "Macro / Allocation" },
];

const QUICK_ACTIONS = [
  "Summarize today's market action",
  "Compare valuation of two stocks",
  "Explain the latest quarterly result",
];

const CHART_TABS = [
  { key: "tenDay", label: "10D" },
  { key: "fifteenDay", label: "15D" },
  { key: "thirtyDay", label: "30D" },
];

const THINKING_LABELS = ["Thinking", "Checking sources"];

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

function TypingIndicator() {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLabelIndex((current) => (current + 1) % THINKING_LABELS.length);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="thinking-indicator">
      <div className="thinking-spinner" />
      <span>{THINKING_LABELS[labelIndex]}</span>
    </div>
  );
}

function StockChart({ chart }) {
  const [activeTab, setActiveTab] = useState("tenDay");
  const gradientId = useId().replace(/:/g, "");

  if (!chart || !chart.chartData) return null;

  const data = chart.chartData[activeTab] || [];
  const prices = data
    .map((point) => Number(point.close))
    .filter((value) => Number.isFinite(value));
  const firstClose = prices[0];
  const lastClose = prices[prices.length - 1];
  const high = prices.length ? Math.max(...prices) : null;
  const low = prices.length ? Math.min(...prices) : null;
  const isUp = prices.length >= 2 ? lastClose >= firstClose : true;
  const color = isUp ? "#1d9b63" : "#d6614f";
  const pctChange =
    prices.length >= 2 && firstClose
      ? (((lastClose - firstClose) / firstClose) * 100).toFixed(2)
      : null;

  const chartData = data.map((point) => ({
    ...point,
    date: formatChartDate(point.date),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-date">{payload[0]?.payload?.date}</div>
        <div className="chart-tooltip-price">Rs {formatCurrency(payload[0]?.value)}</div>
      </div>
    );
  };

  return (
    <section className="stock-chart-card">
      <div className="chart-header">
        <div className="chart-heading">
          <span className="chart-icon-wrap">
            <ChartIcon />
          </span>
          <div>
            <div className="chart-ticker-row">
              <span className="chart-ticker">{chart.ticker}</span>
              {pctChange !== null && (
                <span className={`chart-change ${isUp ? "up" : "down"}`}>
                  {isUp ? "+" : "-"}
                  {Math.abs(Number(pctChange)).toFixed(2)}%
                </span>
              )}
            </div>
            <span className="chart-company">{chart.companyName}</span>
          </div>
        </div>

        <div className="chart-tabs" role="tablist" aria-label="Chart range">
          {CHART_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`chart-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-metrics">
        <div>
          <span>Last</span>
          <strong>{lastClose ? `Rs ${formatCurrency(lastClose)}` : "--"}</strong>
        </div>
        <div>
          <span>High</span>
          <strong>{high ? `Rs ${formatCurrency(high)}` : "--"}</strong>
        </div>
        <div>
          <span>Low</span>
          <strong>{low ? `Rs ${formatCurrency(low)}` : "--"}</strong>
        </div>
      </div>

      <div className="chart-body">
        {chartData.length === 0 ? (
          <div className="chart-no-data">No data available for this range.</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(37, 48, 44, 0.12)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#65706c", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#65706c", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(value) => `Rs ${Number(value).toLocaleString("en-IN")}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: "#f5efe3", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function Sources({ sources }) {
  if (!sources?.length) return null;

  return (
    <section className="sources-section">
      <span className="section-label">Sources</span>
      <div className="sources-list">
        {sources.map((source, index) => (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-pill"
          >
            <span className="source-count">{String(index + 1).padStart(2, "0")}</span>
            <span className="source-copy">
              <span className="source-title">{source.title || getSourceDomain(source.url)}</span>
              <span className="source-domain">{getSourceDomain(source.url)}</span>
            </span>
            <span className="source-link-icon">
              <LinkIcon />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function MessageBubble({ msg, onFollowUp, onCopy, copied }) {
  const isUser = msg.role === "user";
  const messageTime = formatMessageTime(msg.createdAt);

  return (
    <article className={`message-row ${isUser ? "user-row" : "bot-row"}`}>
      {!isUser && (
        <div className="bot-avatar" aria-hidden="true">
          <SparkleIcon />
        </div>
      )}

      <div className={`bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
        <div className="bubble-topline">
          <span className="bubble-role">{isUser ? "You" : "Finara"}</span>
          {msg.fromCache && <span className="cache-badge">Cached insight</span>}
        </div>

        {isUser ? (
          <div className="bubble-text user-text">{msg.content}</div>
        ) : (
          <div className="bubble-text markdown-body">
            <ReactMarkdown
              components={{
                a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}

        {msg.standaloneQuery && (
          <div className="standalone-query">
            <span>Interpreted as</span>
            <em>{msg.standaloneQuery}</em>
          </div>
        )}

        {msg.chart && <StockChart chart={msg.chart} />}
        {msg.sources && <Sources sources={msg.sources} />}

        {msg.followUps?.length > 0 && (
          <section className="follow-up-section">
            <span className="section-label">Related questions</span>
            <div className="follow-up-chips">
              {msg.followUps.map((followUp, index) => (
                <button key={`${followUp}-${index}`} type="button" className="chip" onClick={() => onFollowUp(followUp)}>
                  {followUp}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="bubble-footer">
          <span className="bubble-time">{messageTime}</span>
          {!isUser && (
            <button type="button" className={`copy-btn ${copied ? "copied" : ""}`} onClick={() => onCopy(msg)}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SidebarItem({ conv, active, onClick }) {
  const title = conv.title || "New conversation";
  const preview = conv.lastMessage || conv.preview || "Open thread";
  const date = formatConversationDate(conv.updatedAt || conv.createdAt);

  return (
    <button type="button" className={`sidebar-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="sidebar-item-mark" aria-hidden="true" />
      <span className="sidebar-item-copy">
        <span className="sidebar-item-title">{title}</span>
        <span className="sidebar-item-preview">{preview}</span>
      </span>
      {date && <span className="sidebar-item-date">{date}</span>}
    </button>
  );
}

function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash-panel">
        <div className="splash-badge">StockLens workspace</div>
        <div className="splash-orb">
          <div className="splash-orb-ring" />
          <span className="splash-mark">F</span>
        </div>
        <p className="splash-label">Loading conversations, preferences, and market workspace.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarOpen);
  const [isMobileView, setIsMobileView] = useState(getInitialMobileState);
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [error, setError] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const bottomRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const activeConvIdRef = useRef(null);
  const textareaRef = useRef(null);
  const copiedTimeoutRef = useRef(null);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    window.localStorage.setItem("finara:sidebar-open", String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 980);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    if (bootstrapping) return;
    const draftKey = activeConvId ? `finara:draft:${activeConvId}` : "finara:draft:new";
    setInput(window.localStorage.getItem(draftKey) || "");
  }, [activeConvId, bootstrapping]);

  useEffect(() => {
    if (bootstrapping) return;
    const draftKey = activeConvId ? `finara:draft:${activeConvId}` : "finara:draft:new";
    if (input.trim()) {
      window.localStorage.setItem(draftKey, input);
    } else {
      window.localStorage.removeItem(draftKey);
    }
  }, [activeConvId, bootstrapping, input]);

  useEffect(() => {
    if (!messages.length && !loading) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, messages]);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) {
      window.clearTimeout(copiedTimeoutRef.current);
    }
  }, []);

  const updateScrollState = useCallback(() => {
    const node = messagesAreaRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    setShowScrollButton(distanceFromBottom > 140);
  }, []);

  const refreshConversations = useCallback(async (currentUserId) => {
    const data = await apiFetch(`/conversations?userId=${currentUserId}`);
    setConversations(Array.isArray(data) ? data : data.conversations || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const currentUserId = await bootstrapUser();
        setUserId(currentUserId);
        await refreshConversations(currentUserId);
      } catch {
        setError("Could not connect to the server. Verify the API URL and try again.");
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [refreshConversations]);

  const focusComposer = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const closeSidebarIfMobile = useCallback(() => {
    if (isMobileView) setSidebarOpen(false);
  }, [isMobileView]);

  const mapConversationMessages = useCallback((data) => {
    const rawMessages = data.messages || data.history || [];

    return rawMessages.map((message, index) => ({
      role: message.role,
      content: message.content || message.text,
      followUps: message.followUps || [],
      fromCache: message.fromCache || false,
      standaloneQuery: message.standaloneQuery || null,
      chart: message.chart || null,
      sources: message.sources || [],
      createdAt: message.createdAt || message.updatedAt || null,
      id: message.id || `${message.role}-${index}-${message.createdAt || index}`,
    }));
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading || !userId) return;

      setError(null);

      const createdAt = new Date().toISOString();
      const userMessage = { role: "user", content: text, id: `local-user-${Date.now()}`, createdAt };

      setMessages((current) => [...current, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const requestBody = { query: text, userId };
        if (activeConvIdRef.current) {
          requestBody.conversationId = activeConvIdRef.current;
        }

        const data = await apiFetch("/chat", {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        if (data.conversationId && !activeConvIdRef.current) {
          setActiveConvId(data.conversationId);
        }

        await refreshConversations(userId);

        const assistantMessage = {
          role: "assistant",
          content: data.answer || data.response || data.message || JSON.stringify(data),
          followUps: data.followUps || [],
          fromCache: data.fromCache || false,
          standaloneQuery: data.standaloneQuery || null,
          chart: data.chart || null,
          sources: data.sources || [],
          createdAt: new Date().toISOString(),
          id: `local-assistant-${Date.now()}`,
        };

        setMessages((current) => [...current, assistantMessage]);
      } catch {
        setError("Something went wrong while sending that message.");
        setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      } finally {
        setLoading(false);
        focusComposer();
      }
    },
    [focusComposer, loading, refreshConversations, userId],
  );

  const sendFollowUp = useCallback(
    async (followUpText) => {
      if (loading || !userId || !activeConvIdRef.current) return;

      setError(null);

      const createdAt = new Date().toISOString();
      const userMessage = { role: "user", content: followUpText, id: `local-follow-up-${Date.now()}`, createdAt };

      setMessages((current) => [...current, userMessage]);
      setLoading(true);

      try {
        const data = await apiFetch("/chat/follow_up", {
          method: "POST",
          body: JSON.stringify({
            query: followUpText,
            conversationId: activeConvIdRef.current,
            userId,
          }),
        });

        await refreshConversations(userId);

        const assistantMessage = {
          role: "assistant",
          content: data.answer || data.response || data.message || JSON.stringify(data),
          followUps: data.followUps || [],
          fromCache: data.fromCache || false,
          standaloneQuery: data.standaloneQuery || null,
          chart: data.chart || null,
          sources: data.sources || [],
          createdAt: new Date().toISOString(),
          id: `local-follow-up-answer-${Date.now()}`,
        };

        setMessages((current) => [...current, assistantMessage]);
      } catch {
        setError("Something went wrong while loading that follow-up.");
        setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      } finally {
        setLoading(false);
        focusComposer();
      }
    },
    [focusComposer, loading, refreshConversations, userId],
  );

  const loadConversation = useCallback(
    async (conversation) => {
      if (conversation.id === activeConvIdRef.current || !userId) {
        closeSidebarIfMobile();
        return;
      }

      setActiveConvId(conversation.id);
      setMessages([]);
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch(`/conversations/${conversation.id}?userId=${userId}`);
        setMessages(mapConversationMessages(data));
      } catch {
        setMessages([]);
        setError("Unable to load that conversation right now.");
      } finally {
        setLoading(false);
        closeSidebarIfMobile();
      }
    },
    [closeSidebarIfMobile, mapConversationMessages, userId],
  );

  const newConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setError(null);
    closeSidebarIfMobile();
    window.setTimeout(() => {
      focusComposer();
    }, 0);
  }, [closeSidebarIfMobile, focusComposer]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const handleCopyMessage = useCallback(async (message) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const helper = document.createElement("textarea");
        helper.value = message.content;
        helper.setAttribute("readonly", "");
        helper.style.position = "absolute";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }

      setCopiedMessageId(message.id);
      if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopiedMessageId((current) => (current === message.id ? null : current));
      }, 1800);
    } catch {
      setError("Could not copy that response.");
    }
  }, []);

  const jumpToLatest = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConvId) || null;
  const filteredConversations = conversations.filter((conversation) => {
    const haystack = `${conversation.title || ""} ${conversation.lastMessage || ""} ${conversation.preview || ""}`.toLowerCase();
    return haystack.includes(sidebarQuery.trim().toLowerCase());
  });
  const sourceCount = messages.reduce((count, message) => count + (message.sources?.length || 0), 0);
  const chartCount = messages.reduce((count, message) => count + (message.chart ? 1 : 0), 0);

  if (bootstrapping) {
    return <SplashScreen />;
  }

  return (
    <div className="app-shell">
      {isMobileView && sidebarOpen && <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />}

      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"} ${isMobileView ? "mobile" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-mark">F</span>
            {sidebarOpen && (
              <div className="brand-copy">
                <span className="brand-name">Finara</span>
                <span className="brand-subtitle">Research cockpit</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <MenuIcon />
          </button>
        </div>

        {sidebarOpen ? (
          <>
            <button type="button" className="new-chat-btn" onClick={newConversation}>
              <PlusIcon />
              <span>New conversation</span>
            </button>

            <div className="sidebar-search">
              <SearchIcon />
              <input
                type="text"
                value={sidebarQuery}
                onChange={(event) => setSidebarQuery(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
              />
            </div>

            <div className="sidebar-summary">
              <div>
                <span className="sidebar-summary-label">Threads</span>
                <strong>{conversations.length}</strong>
              </div>
              <div>
                <span className="sidebar-summary-label">Live status</span>
                <strong>{userId ? "Ready" : "Offline"}</strong>
              </div>
            </div>

            <div className="sidebar-section-head">
              <span>Recent</span>
              {sidebarQuery && <span>{filteredConversations.length}</span>}
            </div>

            <div className="sidebar-list">
              {filteredConversations.length === 0 ? (
                <p className="sidebar-empty">{sidebarQuery ? "No matching conversations." : "No conversations yet."}</p>
              ) : (
                filteredConversations.map((conversation) => (
                  <SidebarItem
                    key={conversation.id}
                    conv={conversation}
                    active={conversation.id === activeConvId}
                    onClick={() => loadConversation(conversation)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          !isMobileView && (
            <button
              type="button"
              className="icon-btn new-chat-icon-btn"
              onClick={newConversation}
              aria-label="New conversation"
            >
              <PlusIcon />
            </button>
          )
        )}
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-header-copy">
            {isMobileView && !sidebarOpen && (
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
            )}
            <span className="eyebrow">AI market research</span>
            <h1>{activeConversation?.title || "Build your next market question"}</h1>
          </div>

          <div className="header-actions">
            <div className="header-pill-row">
              <span className="header-pill">{conversations.length} threads</span>
              <span className="header-pill">{messages.length} messages</span>
              <span className={`header-pill status-pill ${userId ? "is-connected" : ""}`}>{userId ? "Connected" : "Offline"}</span>
            </div>
            <button type="button" className="header-new-btn" onClick={newConversation}>
              <PlusIcon />
              <span>Fresh thread</span>
            </button>
          </div>
        </header>

        <div className="messages-area" ref={messagesAreaRef} onScroll={updateScrollState}>
          {messages.length === 0 && !loading ? (
            <section className="hero-panel">
              <div className="hero-copy">
                <span className="eyebrow">StockLens assistant</span>
                <h2>Ask about price moves, earnings, macro shifts, or any listed company in plain language.</h2>
                <p>
                  The workspace stays focused on speed and evidence: you get direct answers, charts when available,
                  follow-up prompts, and linked sources without leaving the thread.
                </p>

                <div className="hero-actions">
                  {QUICK_ACTIONS.map((action) => (
                    <button key={action} type="button" className="hero-chip" onClick={() => setInput(action)}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hero-sidecard">
                <div className="hero-sidecard-top">
                  <span className="hero-sidecard-label">Workspace signals</span>
                  <span className="hero-sidecard-status">Ready</span>
                </div>
                <div className="hero-metric-grid">
                  <div className="hero-metric">
                    <span>Conversations</span>
                    <strong>{conversations.length}</strong>
                  </div>
                  <div className="hero-metric">
                    <span>Charts</span>
                    <strong>On demand</strong>
                  </div>
                  <div className="hero-metric">
                    <span>Sources</span>
                    <strong>Linked</strong>
                  </div>
                  <div className="hero-metric">
                    <span>Replies</span>
                    <strong>Context aware</strong>
                  </div>
                </div>
              </div>

              <div className="starter-grid">
                {STARTER_PROMPTS.map((prompt) => (
                  <button key={prompt.label} type="button" className="starter-card" onClick={() => sendMessage(prompt.label)}>
                    <span className="starter-label">{prompt.label}</span>
                    <span className="starter-sub">{prompt.sub}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="conversation-overview">
              <div>
                <span className="eyebrow">Thread overview</span>
                <h2>{activeConversation?.title || "Current conversation"}</h2>
                <p>Keep drilling down with follow-ups, copy responses for notes, or jump to the newest reply when the thread gets long.</p>
              </div>
              <div className="overview-metrics">
                <div>
                  <span>Messages</span>
                  <strong>{messages.length}</strong>
                </div>
                <div>
                  <span>Sources</span>
                  <strong>{sourceCount}</strong>
                </div>
                <div>
                  <span>Charts</span>
                  <strong>{chartCount}</strong>
                </div>
              </div>
            </section>
          )}

          <div className="messages-stream">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                msg={message}
                onFollowUp={sendFollowUp}
                onCopy={handleCopyMessage}
                copied={copiedMessageId === message.id}
              />
            ))}

            {loading && (
              <div className="message-row bot-row">
                <div className="bot-avatar loading-avatar" aria-hidden="true">
                  <SparkleIcon />
                </div>
                <div className="bubble bot-bubble">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {error && <div className="error-toast">{error}</div>}
            <div ref={bottomRef} />
          </div>

          {showScrollButton && (
            <button type="button" className="scroll-latest-btn" onClick={jumpToLatest}>
              <ArrowDownIcon />
              <span>Latest</span>
            </button>
          )}
        </div>

        <div className="input-area">
          {messages.length > 0 && (
            <div className="composer-quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="composer-quick-chip"
                  onClick={() => {
                    setInput(action);
                    focusComposer();
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <div className="input-box">
            <textarea
              ref={textareaRef}
              className="chat-input"
              rows={1}
              placeholder="Ask about a stock, sector, or market event..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <div className="composer-side">
              <span className="composer-count">{input.trim().length} chars</span>
              <button type="button" className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                <SendIcon />
              </button>
            </div>
          </div>

          <p className="input-hint">Press Enter to send, Shift + Enter for a new line. Drafts are preserved per thread.</p>
        </div>
      </main>
    </div>
  );
}