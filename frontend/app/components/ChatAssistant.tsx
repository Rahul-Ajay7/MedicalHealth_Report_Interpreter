"use client";

import { useState, useRef, useEffect } from "react";
import { useReport } from "@/context/ReportContext";
import { askLLMChat } from "@/services/api";
import { Send, Bot, Sparkles } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatAssistant() {
  const { report } = useReport();
  const nlpExplanation = report?.nlp_explanation || [];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
      setMessages([
        {
          role: "assistant",
          content: "Here's the analysis of your report:\n\n" + nlpExplanation.join("\n\n"),
        },
      ]);
    }
  }, [nlpExplanation, report, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !report || loading) return;
    const question = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

    try {
      const res = await askLLMChat({ file_id: report.file_id, question });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: res.answer };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, something went wrong." };
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Health Assistant</p>
          <p className="text-xs text-slate-400">Ask about your results</p>
        </div>
        <div className={`ml-auto w-2 h-2 rounded-full ${report ? "bg-green-400" : "bg-slate-300"}`} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot size={12} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-700 rounded-bl-sm"
              }`}
            >
              {msg.content === "..." ? (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              ) : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 px-4 py-3 flex gap-2 items-end">
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