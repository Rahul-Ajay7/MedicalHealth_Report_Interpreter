"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I can explain your report. Ask me anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll ONLY inside message panel
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Based on your report, some values are outside the normal range. Would you like a detailed explanation?",
        },
      ]);
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm w-full max-w-[95%] h-[746px] flex flex-col">
      {/* Header (fixed height) */}
      <div className="border-b px-4 py-3 font-semibold text-slate-800 shrink-0">
        AI Health Assistant
      </div>

      {/* Messages (ONLY this scrolls) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] px-3 py-2 rounded-lg ${
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

      {/* Input (fixed height) */}
      <div className="border-t p-3 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your report..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-4 rounded-lg transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
