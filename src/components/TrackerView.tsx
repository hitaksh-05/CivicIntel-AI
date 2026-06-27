import React, { useState, useEffect } from "react";
import { CheckSquare, Clock, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, UserCheck, RefreshCw, Filter, Trash2 } from "lucide-react";
import { NavTab } from "../types";
import { getIncidentMetrics } from "../utils/incidentStats";
import { useIncidents } from "../hooks/useIncidents";

interface TrackerViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({ onNavigate }) => {
  const { incidents: sharedIncidents } = useIncidents();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState<string>("All");
  const [summary, setSummary] = useState({ total: 0, active: 0, resolved: 0 });

  const loadTickets = async () => {
    const mapped = (sharedIncidents || []).map((inc: any) => ({
      id: inc.id,
      ticketNumber: inc.ticketId || inc.ticketNumber,
      title: inc.title,
      department: inc.department,
      priority: inc.priority || inc.severity,
      status: inc.kanbanStatus || "todo",
      timeLogged: inc.timeLogged,
      assignee: inc.assignee || inc.unitEnRoute || null
    }));
    setTickets(mapped);
    const metrics = getIncidentMetrics(sharedIncidents || []);
    setSummary({
      total: metrics.totalIncidents,
      active: metrics.openIncidents.length,
      resolved: metrics.resolvedIncidents.length
    });
  };

  const deleteTicket = async (ticketId: string) => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this incident?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/incidents/${ticketId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete ticket");
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      window.dispatchEvent(new CustomEvent("incidents:changed"));
    } catch {
      loadTickets();
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [sharedIncidents]);

  const depts = ["All", "Water & Sewage", "Electricity & Power", "Roads & Transit", "Structural & Bridges", "Public Safety"];

  const filteredTickets = tickets.filter(t => 
    filterDept === "All" || t.department.toLowerCase().includes(filterDept.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Automated Incident Resolution Tracker
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-[#050914] p-1.5 rounded-xl border border-slate-800 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
          {depts.map(d => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                filterDept === d ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-white">Active Municipal Ticket Audit Log</h3>
          <span className="text-xs font-mono text-slate-400">{summary.active} Active · {summary.resolved} Resolved · {summary.total} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-[#060a14]">
                <th className="py-3.5 px-6">Ticket ID</th>
                <th className="py-3.5 px-6">Infrastructure Subject</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Priority</th>
                <th className="py-3.5 px-6">Current Stage</th>
                <th className="py-3.5 px-6">Assigned Unit</th>
                <th className="py-3.5 px-6 font-mono">Logged</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-4 px-6 font-mono font-bold text-blue-400">{t.ticketNumber}</td>
                  <td className="py-4 px-6 font-medium text-white">{t.title}</td>
                  <td className="py-4 px-6 font-mono text-slate-300">{t.department}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      t.priority === "Critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      t.priority === "High" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300 capitalize">
                      <span className={`w-2 h-2 rounded-full ${
                        t.status === "completed" ? "bg-emerald-400" :
                        t.status === "in_progress" ? "bg-blue-400 animate-pulse" : "bg-amber-400"
                      }`} />
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {t.assignee ? (
                        <img src={t.assignee} alt="Assigned unit" className="w-6 h-6 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">U</div>
                      )}
                      <span className="font-mono text-slate-300 text-[11px]">{t.assignee ? "Assigned crew" : "Auto-dispatched"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-400">{t.timeLogged}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onNavigate("command")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTicket(t.id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                        aria-label="Delete incident"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
