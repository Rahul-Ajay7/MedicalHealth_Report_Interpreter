"use client";

import { useState, useRef, useEffect } from "react";
import { useReport } from "@/context/ReportContext";
import { askLLMChat } from "@/services/api";
import { Send, Bot, Sparkles, AlertTriangle, ShieldAlert, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | "emergency"
  | "sensitive"
  | "blocked"
  | "what_if"
  | "report_based"
  | "general_health";

type Message = {
  role:          "user" | "assistant";
  content:       string;
  flagged?:      boolean;
  question_type?: QuestionType;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns styling + icon config based on question type.
 * Emergency = red, Sensitive/Blocked = amber, normal = slate.
 */
function getMessageStyle(msg: Message): {
  bubble: string;
  banner: string | null;
  icon:   React.ReactNode | null;
} {
  if (!msg.flagged || msg.role !== "assistant") {
    return {
      bubble: "bg-slate-100 text-slate-700 rounded-bl-sm",
      banner: null,
      icon:   null,
    };
  }

  if (msg.question_type === "emergency") {
    return {
      bubble: "bg-red-50 text-red-800 border border-red-200 rounded-bl-sm",
      banner: "bg-red-100 text-red-700 border border-red-200",
      icon:   <ShieldAlert size={13} className="text-red-600 shrink-0 mt-0.5" />,
    };
  }

  if (msg.question_type === "sensitive") {
    return {
      bubble: "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-sm",
      banner: "bg-amber-50 text-amber-700 border border-amber-200",
      icon:   <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />,
    };
  }

  if (msg.question_type === "blocked") {
    return {
      bubble: "bg-slate-100 text-slate-600 border border-slate-200 rounded-bl-sm",
      banner: "bg-slate-100 text-slate-500 border border-slate-200",
      icon:   <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />,
    };
  }

  return {
    bubble: "bg-slate-100 text-slate-700 rounded-bl-sm",
    banner: null,
    icon:   null,
  };
}

function getBannerLabel(type: QuestionType | undefined): string {
  switch (type) {
    case "emergency": return "🚨 Emergency — please call 112 or 108 immediately";
    case "sensitive":  return "This question has been handled with care";
    case "blocked":    return "This question is outside the assistant's scope";
    default:           return "";
  }
}

// ─── Disclaimer renderer ──────────────────────────────────────────────────────

/**
 * Splits the answer from the disclaimer line (starts with ⚕️).
 * Renders the disclaimer in a muted italic style below the bubble.
 */
function MessageContent({ content }: { content: string }) {
  const disclaimerMarker = "⚕️";
  const idx = content.indexOf(disclaimerMarker);

  if (idx === -1) {
    return <span className="whitespace-pre-line">{content}</span>;
  }

  const main       = content.slice(0, idx).trim();
  const disclaimer = content.slice(idx).trim();

  return (
    <>
      <span className="whitespace-pre-line">{main}</span>
      <span className="block mt-2 pt-2 border-t border-slate-200 text-xs text-slate-400 italic leading-relaxed">
        {disclaimer}
      </span>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatAssistant() {
  const { report } = useReport();
  const nlpExplanation = report?.nlp_explanation || [];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ── Initialise chat when report loads ──────────────────────────────────────
  useEffect(() => {
    if (!report) return;
    setMessages([{ role: "assistant", content: "Analyzing your report..." }]);
  }, [report?.file_id]);

  useEffect(() => {
    if (
      report &&
      nlpExplanation.length > 0 &&
      messages.length === 1 &&
      messages[0].content === "Analyzing your report..."
    ) {
      setMessages([{
        role:    "assistant",
        content: "Here's the analysis of your report:\n\n" + nlpExplanation.join("\n\n"),
      }]);
    }
  }, [nlpExplanation, report, messages]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !report || loading) return;
    const question = input.trim();
    setInput("");
    setLoading(true);

    // Add user message + loading placeholder
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "..." },
    ]);

    try {
      const res = await askLLMChat({ file_id: report.file_id, question });

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role:          "assistant",
          content:       res.answer,
          flagged:       res.flagged       ?? false,
          question_type: (res.question_type ?? "report_based") as QuestionType,
        };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role:    "assistant",
          content: "Sorry, something went wrong. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[520px]">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Health Assistant</p>
          <p className="text-xs text-slate-400">Ask about your results</p>
        </div>
        <div className={`ml-auto w-2 h-2 rounded-full ${report ? "bg-green-400" : "bg-slate-300"}`} />
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Bot size={22} className="text-blue-400" />
            </div>
            <p className="text-sm text-slate-400 max-w-[200px]">
              Upload a report and ask me anything about your results
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const style = getMessageStyle(msg);

          return (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

              {/* Bot avatar */}
              {msg.role === "assistant" && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0 ${
                  msg.question_type === "emergency"
                    ? "bg-red-100"
                    : msg.flagged
                    ? "bg-amber-100"
                    : "bg-blue-100"
                }`}>
                  <Bot size={12} className={
                    msg.question_type === "emergency"
                      ? "text-red-600"
                      : msg.flagged
                      ? "text-amber-600"
                      : "text-blue-600"
                  } />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-[78%]">

                {/* Flagged banner — shown above bubble */}
                {msg.flagged && style.banner && (
                  <div className={`flex items-start gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${style.banner}`}>
                    {style.icon}
                    <span>{getBannerLabel(msg.question_type)}</span>
                  </div>
                )}

                {/* Message bubble */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : style.bubble
                }`}>
                  {msg.content === "..." ? (
                    <span className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  ) : msg.role === "assistant" ? (
                    <MessageContent content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>

              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-slate-100 px-4 py-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about neutrophils, glucose levels..."
          rows={1}
          className="flex-1 resize-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !report || loading}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white transition flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}