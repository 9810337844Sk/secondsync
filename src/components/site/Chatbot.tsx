import { MessageCircle, Send, X, Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Groq config ───────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";
const GROQ_MODEL   = "qwen/qwen3-32b";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are Mega AI, Your Shopping Partner — the smart assistant for Second Sync, Nepal's #1 second-hand marketplace.

PERSONALITY: Friendly, sharp, and concise. Like a knowledgeable shopkeeper friend in Kathmandu.

ANSWER STYLE — CRITICAL:
- Keep every reply SHORT: 2-4 sentences max, or a tight bullet list (3-5 items)
- No long paragraphs. No filler words. Get straight to the point.
- Use ✅ 💡 🛍️ 📦 💰 emojis naturally to make answers scannable
- End with ONE short follow-up question to keep conversation going

EXPERTISE:
- Second-hand pricing (Nepal market):
  • Electronics: Like New 75-85% of MRP, Excellent 60-75%, Good 40-60%
  • Bikes/Vehicles: -20-30% first year, -10-15% each year after
  • Books: 30-50% of cover price
  • Furniture: 40-60% of original
  • Fashion: 20-40% of original
- Platform: free listing, Khalti digital payment or cash at safe-meet points, Pathao delivery (Rs 100-250 valley, Rs 300+ outside), safe-meet points in 12+ cities
- Buying tips, selling tips, negotiation, condition checks, scam prevention

STRICT RULES:
1. ONLY answer second-hand buying/selling questions. Nothing else.
2. Off-topic? Say: "I only help with second-hand shopping on Second Sync 🛍️ What product can I help with?"
3. Reply in the user's language (Nepali or English)
4. SHORT answers always — never more than 4 sentences or 5 bullet points`;

// ─── Types ─────────────────────────────────────────────────────────────────
type Msg = {
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
};

// ─── Quick suggestions ──────────────────────────────────────────────────────
const QUICK = [
  "💰 Price my used phone?",
  "📦 How to describe condition?",
  "🛡️ How to avoid scams?",
  "🤝 How to negotiate?",
  "🚚 Delivery options?",
  "कसरी बिक्री गर्ने?",
];

// Strip <think>...</think> reasoning blocks that Qwen3 emits
function stripThinking(text: string): string {
  // Remove any complete <think>...</think> blocks
  let out = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // If there's an unclosed <think>, hide everything from it onward
  const open = out.indexOf("<think>");
  if (open !== -1) out = out.slice(0, open);
  return out.trimStart();
}

// ─── Groq streaming fetch ───────────────────────────────────────────────────
async function streamGroq(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.6,
        max_completion_tokens: 1024,
        top_p: 0.95,
        stream: true,
        stop: null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      onError(err?.error?.message ?? `Error ${res.status}`);
      return;
    }

    const reader  = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.replace("data: ", "").trim();
        if (data === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(data);
          const token  = parsed.choices?.[0]?.delta?.content;
          if (token) onChunk(token);
        } catch {
          // skip malformed chunks
        }
      }
    }
    onDone();
  } catch (e: any) {
    onError(e?.message ?? "Network error. Please try again.");
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
export function Chatbot() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Namaste! 🛍️ I'm **Mega AI**, your shopping partner.\n\nAsk me anything about buying, selling, or pricing second-hand products in Nepal — I'll keep it short and sweet!",
    },
  ]);

  const endRef      = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const historyRef  = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;

    setInput("");

    // Add user message
    const userMsg: Msg = { role: "user", text: t };
    setMessages((prev) => [...prev, userMsg]);

    // Track history for context (last 10 messages)
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: t },
    ].slice(-10);

    // Add empty streaming bot message
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", text: "", streaming: true }]);

    let fullText = "";

    streamGroq(
      historyRef.current,
      (chunk) => {
        fullText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: stripThinking(fullText),
            streaming: true,
          };
          return updated;
        });
      },
      () => {
        const clean = stripThinking(fullText);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: clean,
            streaming: false,
          };
          return updated;
        });
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: clean },
        ].slice(-10);
        setLoading(false);
      },
      (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: `Sorry, something went wrong: ${err}`,
            streaming: false,
          };
          return updated;
        });
        setLoading(false);
      }
    );
  }

  function clearChat() {
    historyRef.current = [];
    setMessages([
      {
        role: "assistant",
        text: "Chat cleared! 🛍️ What would you like to buy or sell today?",
      },
    ]);
  }

  /** Render markdown-lite: bold, line breaks */
  function renderText(text: string) {
    return text
      .split("\n")
      .map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : <span key={j}>{part}</span>
            )}
            {i < text.split("\n").length - 1 && <br />}
          </span>
        );
      });
  }

  const showQuick = messages.length <= 1;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-crimson text-paper shadow-elegant transition-all hover:scale-110 hover:shadow-[0_8px_30px_rgba(192,57,43,0.5)] ${!open ? "animate-glow-pulse" : ""}`}
        aria-label="Open AI chat assistant"
      >
        {open
          ? <X className="h-6 w-6" />
          : <MessageCircle className="h-6 w-6" />
        }
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-ink">
            AI
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[580px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-paper shadow-elegant animate-scale-pop origin-bottom-right">

          {/* Header */}
          <div className="bg-gradient-hero px-4 py-3.5 text-paper">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-paper/15">
                  <span className="text-lg">🛍️</span>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-ping absolute" />
                    <span className="h-2 w-2 rounded-full bg-green-500 relative" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-display text-base font-semibold">
                    Mega AI
                    <span className="flex items-center gap-0.5 rounded-full bg-gold/30 px-1.5 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wide">
                      <Sparkles className="h-2.5 w-2.5" /> AI
                    </span>
                  </div>
                  <div className="text-[11px] text-paper/70">Your Shopping Partner · Powered by Groq</div>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="rounded-lg p-1.5 text-paper/60 hover:bg-paper/10 hover:text-paper transition-colors"
                title="Clear chat"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${Math.min(i * 30, 120)}ms` }}>
                {m.role === "assistant" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-hero text-sm">
                    🛍️
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-crimson text-paper"
                      : "rounded-tl-sm bg-card text-ink shadow-card"
                  }`}
                >
                  {m.text
                    ? renderText(m.text)
                    : m.streaming
                    ? <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="flex gap-1">
                          {[0,1,2].map(d => (
                            <span
                              key={d}
                              className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                              style={{ animationDelay: `${d * 150}ms` }}
                            />
                          ))}
                        </span>
                        Thinking…
                      </span>
                    : null
                  }
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Quick suggestions */}
          {showQuick && (
            <div className="flex flex-wrap gap-1.5 border-t border-border bg-paper px-3 py-2.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={loading}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-ink transition-colors hover:border-crimson hover:bg-crimson/5 hover:text-crimson disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-border bg-paper p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? "Mega AI is thinking…" : "Ask about buying, selling, pricing…"}
              disabled={loading}
              className="flex-1 rounded-full border border-border bg-secondary px-4 py-2.5 text-sm outline-none transition-colors focus:border-crimson disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-crimson text-paper shadow-card transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              {loading
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </form>

          <div className="bg-paper px-4 pb-2.5 text-center text-[10px] text-muted-foreground">
            Mega AI · Your Shopping Partner · Second Sync
          </div>
        </div>
      )}
    </>
  );
}
