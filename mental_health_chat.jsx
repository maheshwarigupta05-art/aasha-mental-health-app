import { useState, useRef, useEffect } from "react";

const RESOURCES = {
  crisis: [
    { name: "iCall (India)", contact: "9152987821", type: "Helpline" },
    { name: "Vandrevala Foundation", contact: "1860-2662-345", type: "24/7 Helpline" },
    { name: "SNEHI", contact: "044-24640050", type: "Emotional Support" },
  ],
  professional: [
    { name: "YourDOST", contact: "yourdost.com", type: "Online Counselling" },
    { name: "Therapize India", contact: "therapize.in", type: "Affordable Therapy" },
    { name: "Mpower", contact: "1800-120-820050", type: "Mental Health" },
  ],
  selfhelp: [
    { name: "Calm breathing exercise", contact: "4-7-8 technique", type: "Try now" },
    { name: "Grounding technique", contact: "5-4-3-2-1 senses", type: "Try now" },
    { name: "InnerHour App", contact: "innerhour.com", type: "Self-care App" },
  ],
};

function classifySeverity(text) {
  const t = text.toLowerCase();
  const crisisWords = ["suicide", "kill myself", "end it", "don't want to live", "hurt myself", "self harm", "die", "no point living"];
  const severeWords = ["can't cope", "breaking down", "hopeless", "worthless", "panic", "can't breathe", "losing my mind", "depressed", "anxiety attack"];
  if (crisisWords.some(w => t.includes(w))) return "crisis";
  if (severeWords.some(w => t.includes(w))) return "severe";
  return "mild";
}

const SYSTEM_PROMPT = `You are a compassionate, warm mental health first responder named Aasha. Your role is to:
1. Listen with deep empathy and validate feelings without judgment
2. Ask ONE gentle follow-up question to understand better
3. Never give medical diagnoses
4. Keep responses SHORT (2-4 sentences max) and human
5. Use simple, warm language — like a caring friend, not a clinical chatbot
6. If someone mentions self-harm or suicide, gently acknowledge it and say help is available
7. End each response with a small action or question that helps them open up
Respond in the same language the user writes in (Hindi or English).`;

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I'm Aasha 🌿 A safe space for you to share what's on your mind. Everything here is anonymous and judgment-free.\n\nHow are you feeling right now?",
      severity: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState(null);
  const [phase, setPhase] = useState("chat");
  const bottomRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, resources]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const severity = classifySeverity(text);
    const userMsg = { role: "user", content: text, severity };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    if (severity === "crisis") {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "I hear you, and I'm so glad you said something. What you're feeling is real and valid — and you deserve support right now. You're not alone in this.\n\nPlease reach out to a crisis helpline immediately — real people are there for you 24/7.",
          severity: "crisis",
        }]);
        setResources(RESOURCES.crisis);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const apiMessages = newMessages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm here with you. Can you tell me a little more?";

      setMessages(prev => [...prev, { role: "assistant", content: reply, severity }]);

      if (severity === "severe" && newMessages.filter(m => m.role === "user").length >= 2) {
        setResources(RESOURCES.professional);
      } else if (newMessages.filter(m => m.role === "user").length >= 3 && !resources) {
        setResources(RESOURCES.selfhelp);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm here with you. Sometimes words are hard to find — take your time. What's weighing on you most right now?",
        severity: null,
      }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const severityColor = (s) => {
    if (s === "crisis") return "#ff6b6b";
    if (s === "severe") return "#ffaa4d";
    return null;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: "16px",
    }}>
      {/* Ambient background orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(100,180,140,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,160,220,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4db87a, #3a9e6a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e8f4f0", letterSpacing: 0.5 }}>Aasha</div>
              <div style={{ fontSize: 11, color: "#5db88a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace" }}>Safe · Anonymous · Always here</div>
            </div>
          </div>
          <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #4db87a, transparent)", margin: "0 auto" }} />
        </div>

        {/* Chat window */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          height: 420,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          backdropFilter: "blur(10px)",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1a3a28", border: "1px solid #4db87a33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginRight: 8, marginTop: 2 }}>🌿</div>
              )}
              <div style={{
                maxWidth: "78%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #2a5c42, #1e4a35)"
                  : severityColor(msg.severity)
                    ? `linear-gradient(135deg, ${severityColor(msg.severity)}22, rgba(255,255,255,0.04))`
                    : "rgba(255,255,255,0.05)",
                border: msg.role === "user"
                  ? "1px solid rgba(77,184,122,0.3)"
                  : severityColor(msg.severity)
                    ? `1px solid ${severityColor(msg.severity)}44`
                    : "1px solid rgba(255,255,255,0.07)",
                color: "#d4ede4",
                fontSize: 14,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}>
                {msg.content}
                {msg.severity === "crisis" && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#ff9999", fontFamily: "monospace" }}>⚠ Crisis support available below</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1a3a28", border: "1px solid #4db87a33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🌿</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{
                    width: 7, height: 7, borderRadius: "50%", background: "#4db87a",
                    animation: "pulse 1.2s ease-in-out infinite",
                    animationDelay: `${j * 0.2}s`,
                    opacity: 0.7,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "12px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          backdropFilter: "blur(8px)",
        }}>
          <textarea
            ref={textRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Share what's on your mind... (Hindi or English)"
            rows={2}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#d4ede4",
              fontSize: 14,
              fontFamily: "Georgia, serif",
              resize: "none",
              lineHeight: 1.6,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: input.trim() && !loading ? "linear-gradient(135deg, #4db87a, #3a9e6a)" : "rgba(255,255,255,0.06)",
              border: "none",
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {loading ? "⏳" : "↑"}
          </button>
        </div>

        {/* Resources panel */}
        {resources && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(77,184,122,0.2)",
            borderRadius: 16,
            padding: "14px 16px",
            backdropFilter: "blur(8px)",
          }}>
            <div style={{ fontSize: 11, color: "#4db87a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>
              {resources === RESOURCES.crisis ? "⚠ Immediate help" : resources === RESOURCES.professional ? "👥 Talk to someone" : "💚 Try these first"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {resources.map((r, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#d4ede4", fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "#7ab89a", marginTop: 1 }}>{r.type}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#4db87a", fontFamily: "monospace", fontWeight: 700 }}>{r.contact}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", letterSpacing: 1 }}>
          ANONYMOUS · NO DATA STORED · ALWAYS FREE
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        textarea::placeholder { color: rgba(212,237,228,0.3); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(77,184,122,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}
