import React from "react";
import { NavTab } from "../types";
import { 
  LayoutGrid, 
  Map, 
  FileText, 
  Cpu, 
  Radio, 
  TrendingUp, 
  CheckSquare, 
  Activity, 
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  unreadCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { id: "landing", label: "Platform Overview", icon: <Sparkles className="w-5 h-5 text-blue-400" /> },
    { id: "dashboard", label: "Dashboard", icon: <LayoutGrid className="w-5 h-5" /> },
    { id: "map", label: "City Map", icon: <Map className="w-5 h-5" />, badge: "LIVE", badgeColor: "bg-red-500/20 text-red-400 border border-red-500/30" },
    { id: "report", label: "Report Incident", icon: <FileText className="w-5 h-5" /> },
    { id: "analysis", label: "AI Analysis", icon: <Cpu className="w-5 h-5 text-purple-400" /> },
    { id: "command", label: "Command Center", icon: <Radio className="w-5 h-5 text-emerald-400" /> },
    { id: "insights", label: "Predictive Insights", icon: <TrendingUp className="w-5 h-5 text-amber-400" /> },
    { id: "tracker", label: "Resolution Tracker", icon: <CheckSquare className="w-5 h-5" />, badge: `${unreadCount}`, badgeColor: "bg-blue-600 text-white" }
  ];

  return (
    <aside 
      className={`bg-[#080d1a] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-base tracking-wider bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                  CivicIntel AI
                </h1>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  OS v1.0
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {!collapsed && (
            <div className="px-3 pb-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
              Infrastructure Modules
            </div>
          )}
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 text-blue-400 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"} transition-colors`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${item.badgeColor || "bg-slate-800 text-slate-300"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>


    </aside>
  );
};
