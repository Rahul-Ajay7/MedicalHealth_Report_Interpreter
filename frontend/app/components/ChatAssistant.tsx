"use client";

import { useState, useRef, useEffect } from "react";
import { useReport } from "@/context/ReportContext";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatAssistant() {
  const { report } = useReport();
  const nlpExplanation = report?.nlp_explanation || [];

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Analyzing your report...",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- INJECT NLP OUTPUT ---------------- */
  useEffect(() => {
    if (
      nlpExplanation.length > 0 &&
      messages[messages.length - 1].content === "Analyzing your report..."
    ) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Here’s the analysis of your report:\n\n" + nlpExplanation.join("\n\n"),
        },
      ]);
    }
  }, [nlpExplanation, messages]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- SEND MESSAGE (NLP-ONLY MODE) ---------------- */
  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      {
        role: "assistant",
        content:
          "I can explain abnormal values shown above. Advanced chat will be enabled soon.",
      },
    ]);

    setInput("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm w-full max-w-[95%] h-[746px] flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 font-semibold text-slate-800 shrink-0">
        AI Health Assistant
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-line ${
              msg.role === "user"
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-100 text-gray-800"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about neutrophils, lymphocytes..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}