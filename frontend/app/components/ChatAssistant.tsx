"use client";

import { useState, useRef, useEffect } from "react";
import { useReport } from "@/context/ReportContext";
import { askLLMChat } from "@/services/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatAssistant() {
  const { report } = useReport();
  const nlpExplanation = report?.nlp_explanation || [];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* --------------------------------------------------
     🔑 RESET CHAT WHEN NEW REPORT IS UPLOADED
  -------------------------------------------------- */
  useEffect(() => {
    if (!report) return;

    setMessages([
      {
        role: "assistant",
        content: "Analyzing your report...",
      },
    ]);
  }, [report?.file_id]); // 👈 CRITICAL

  /* --------------------------------------------------
     Inject NLP explanation ONCE
  -------------------------------------------------- */
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
          content:
            "Here’s the analysis of your report:\n\n" +
            nlpExplanation.join("\n\n"),
        },
      ]);
    }
  }, [nlpExplanation, report, messages]);

  /* --------------------------------------------------
     Auto-scroll
  -------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* --------------------------------------------------
     Send message to backend LLM
  -------------------------------------------------- */
  const sendMessage = async () => {
    if (!input.trim() || !report) return;

    const question = input;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Thinking..." },
    ]);

    const analyzedResults = Object.entries(report.analysis).map(
      ([parameter, data]) => ({
        parameter,
        ...data,
      })
    );

    try {
      const res = await askLLMChat({
  file_id: report.file_id,
  question,
});

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: res.answer,
        };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong.",
        };
        return updated;
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm w-full max-w-[95%] h-[746px] flex flex-col">
      <div className="border-b px-4 py-3 font-semibold">
        AI Health Assistant
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.map((msg, i) => (
          <div
            key={i}
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

      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about neutrophils, lymphocytes..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
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