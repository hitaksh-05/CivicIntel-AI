import React from "react";
import { Bot, Sparkles } from "lucide-react";

interface HeaderProps {
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleCopilot, isCopilotOpen }) => {
  return (
    <header className="h-16 bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-end z-20 sticky top-0">
      <div className="flex items-center gap-4">
        {/* AI Copilot Button */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all ${
            isCopilotOpen
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50"
              : "bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30"
          }`}
        >
          <Bot className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Ask Civic AI Copilot</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </button>
      </div>
    </header>
  );
};
