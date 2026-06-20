"use client";

import { useState, useRef, useEffect } from "react";
import { useReport } from "@/context/ReportContext";
import { askLLMChat, getLanguages, type Language } from "@/services/api";
import { Send, Bot, Sparkles, AlertTriangle, ShieldAlert, Info, Mic, MicOff, Check, X } from "lucide-react";

// Map our language codes to Web Speech BCP-47 locales. Minor languages the
// browser doesn't support fall back to en-IN (still lets the user dictate).
const SPEECH_LOCALE: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", bn: "bn-IN", te: "te-IN", mr: "mr-IN", ta: "ta-IN",
  ur: "ur-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN", or: "or-IN",
  as: "as-IN", ne: "ne-NP", sa: "sa-IN", kok: "kok-IN",
  es: "es-ES", fr: "fr-FR", ar: "ar-SA", zh: "zh-CN",
};
const speechLocale = (code?: string) => (code && SPEECH_LOCALE[code]) || "en-IN";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | "emergency"
  | "sensitive"
  | "blocked"
  | "what_if"
  | "report_based"
  | "general_health";

type Message = {
  role:           "user" | "assistant";
  content:        string;
  flagged?:       boolean;
  question_type?: QuestionType;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

  // sensitive — no banner, just a warm bubble style
  if (msg.question_type === "sensitive") {
    return {
      bubble: "bg-teal-50 text-slate-700 rounded-bl-sm",
      banner: null,
      icon:   null,
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
    case "emergency": return "Please seek medical attention if symptoms are severe";
    case "blocked":   return "This question is outside the assistant's scope";
    default:          return "";
  }
}

// ─── Disclaimer renderer ──────────────────────────────────────────────────────

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

  const [languages, setLanguages] = useState<Language[]>([]);
  const [language, setLanguage]   = useState("English");

  const [listening, setListening]           = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Load supported languages once ──────────────────────────────────────────
  useEffect(() => {
    getLanguages().then(setLanguages).catch(() => {});
  }, []);

  // ── Set up speech-to-text (browser Web Speech API; no server, no API key) ───
  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) return;                       // unsupported browser → hide mic
    setSpeechSupported(true);
    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) setInput((prev) => (prev ? prev + " " : "") + text);
    };
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, []);

  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec || !report || loading) return;
    if (listening) { try { rec.stop(); } catch {} setListening(false); return; }
    const code = languages.find((l) => l.name === language)?.code;
    rec.lang = speechLocale(code);         // dictate in the selected language
    try { rec.start(); setListening(true); } catch {}
  };

  // ── Default the answer language to the one chosen at analyze time ───────────
  useEffect(() => {
    if (report?.language) setLanguage(report.language);
  }, [report?.language]);

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

  // ── Auto-scroll inside chat box only ──────────────────────────────────────
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !report || loading) return;
    const question = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "..." },
    ]);

    try {
      const res = await askLLMChat({ file_id: report.file_id, question, language });

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
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Health Assistant</p>
          <p className="text-xs text-slate-400">Ask about your results</p>
        </div>

        {/* Language selector — replies come back in the chosen language */}
        {languages.length > 0 && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            title="Answer language"
            className="ml-auto text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.name}>
                {l.native}
              </option>
            ))}
          </select>
        )}

        <div className={`ml-2 w-2 h-2 rounded-full ${report ? "bg-green-400" : "bg-slate-300"}`} />
      </div>

      {/* ── Always-on disclaimer strip ── */}
      <div className="flex items-start gap-2 px-5 py-2 bg-amber-50/70 border-b border-amber-100 flex-shrink-0">
        <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-snug">
          Informational only — not medical advice, diagnosis, or prescriptions.{" "}
          <a href="/privacy" className="underline hover:text-amber-800">How your data is used</a>.
        </p>
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3"
      >

        {/* Empty state — what the assistant can / can't do + consent */}
        {messages.length === 0 && (
          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center">
                <Bot size={20} className="text-teal-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Your Health Assistant</p>
              <p className="text-xs text-slate-400 max-w-[230px]">
                Upload a report, then ask me about it — in your language.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-1.5">I can help with</p>
                <ul className="space-y-1">
                  {[
                    "Explain what each value means, in simple words",
                    "Tell you the normal range & if a value is low / normal / high",
                    "General diet & lifestyle tips",
                    "What to ask your doctor",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-snug">
                      <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" /> {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1.5">I can't do</p>
                <ul className="space-y-1">
                  {[
                    "Diagnose a disease",
                    "Prescribe medicines or doses",
                    "Predict outcomes or survival",
                    "Replace a doctor or handle emergencies (dial 112 / 108)",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-snug">
                      <X size={12} className="text-red-400 shrink-0 mt-0.5" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                By chatting, you agree this is <span className="font-medium text-slate-600">information, not medical advice</span>.
                Your questions and lab values are processed to generate answers — including by AI
                providers located outside India — as described in our{" "}
                <a href="/privacy" className="text-teal-600 underline hover:text-teal-700">Privacy Policy</a>.
                You can delete your data anytime.
              </p>
            </div>
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
                    : "bg-teal-100"
                }`}>
                  <Bot size={12} className={
                    msg.question_type === "emergency"
                      ? "text-red-600"
                      : "text-teal-600"
                  } />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-[78%]">

                {/* Banner — only for emergency and blocked, NOT sensitive */}
                {msg.flagged &&
                 style.banner &&
                 msg.question_type !== "sensitive" && (
                  <div className={`flex items-start gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${style.banner}`}>
                    {style.icon}
                    <span>{getBannerLabel(msg.question_type)}</span>
                  </div>
                )}

                {/* Message bubble */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-teal-600 text-white rounded-br-sm"
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

      </div>

      {/* ── Input ── */}
      <div className="border-t border-slate-100 px-4 py-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? "Listening… speak now" : "Ask about neutrophils, glucose levels..."}
          rows={1}
          className="flex-1 resize-none border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
        />
        {speechSupported && (
          <button
            onClick={toggleMic}
            disabled={!report || loading}
            title={listening ? "Stop listening" : "Speak your question in the selected language"}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition flex-shrink-0 disabled:bg-slate-100 disabled:text-slate-300 ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        )}
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !report || loading}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white transition flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </div>

    </div>
  );
}