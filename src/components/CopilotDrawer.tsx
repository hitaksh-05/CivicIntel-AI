import React, { useMemo, useState } from "react";
import { X, Bot, Send, Sparkles } from "lucide-react";
import { CopilotMessage } from "../types";
import { useIncidents } from "../hooks/useIncidents";

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { incidents } = useIncidents();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello, operations team. I’m monitoring the city’s live infrastructure network and can summarize risk, reroute units, or inspect the latest incidents.",
      timestamp: "Just now",
      grounded: true
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<string | null>(null);

  const quickPrompts = useMemo(() => {
    const activeCount = (incidents || []).filter((incident: any) => incident.status !== "Resolved" && incident.kanbanStatus !== "completed").length;
    const criticalCount = (incidents || []).filter((incident: any) => incident.severity === "Critical" || incident.priority === "Critical").length;
    const departmentCount = new Set((incidents || []).map((incident: any) => incident.department || incident.category || "General")).size;

    const prompts = [
      activeCount > 0 ? `Summarize ${activeCount} active incident${activeCount === 1 ? "" : "s"}` : "Give me a system overview",
      criticalCount > 0 ? `Review ${criticalCount} critical incident${criticalCount === 1 ? "" : "s"}` : "Show current incident health",
      departmentCount > 1 ? `Inspect workload across ${departmentCount} department${departmentCount === 1 ? "" : "s"}` : "Summarize current city status",
      "Prioritize the highest severity ticket",
      "Report resolution progress"
    ];

    return Array.from(new Set(prompts));
  }, [incidents]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const conversationHistory = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);
    setThinkingStage("Analyzing municipal data...");

    window.setTimeout(() => setThinkingStage("Reviewing incident database..."), 650);
    window.setTimeout(() => setThinkingStage("Generating operational summary..."), 1300);

    try {
      const res = await fetch("${API}/api/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, history: conversationHistory })
      });
      const data = await res.json();

      const aiMsg: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.answer || "I could not build a live incident-based answer from the current dataset.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grounded: data.grounded
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "The operations assistant could not reach the live incident dataset. Please retry in a moment.",
        timestamp: "Now"
      }]);
    } finally {
      setLoading(false);
      setThinkingStage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#080d1a] border-l border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-1.5">
              CivicIntel Operations AI
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-normal">LIVE</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Grounded on Smart City Telemetry</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Prompts */}
      <div className="p-3 border-b border-slate-800/80 bg-[#060a14]">
        <p className="text-[10px] font-mono uppercase text-slate-500 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Executive Quick Prompts
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="text-left text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-slate-300 px-2.5 py-1.5 rounded-lg transition-all line-clamp-1"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono">
              <span>{msg.sender === "user" ? "You" : "Civic AI Engine"}</span>
              <span>·</span>
              <span>{msg.timestamp}</span>
            </div>
            <div
              className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-mono"
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
            </div>
          </div>
        ))}

        {loading && thinkingStage && (
          <div className="flex items-start gap-2">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-xs text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>{thinkingStage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything about city infrastructure..."
            disabled={loading}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
