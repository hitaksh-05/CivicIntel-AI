import React, { useState, useEffect } from "react";
import { Radio, AlertTriangle, Clock, CheckCircle2, MoreHorizontal, ArrowRight, ShieldAlert, Trash2 } from "lucide-react";
import { KanbanTicket } from "../types";
import { useIncidents } from "../hooks/useIncidents";

export const CommandView: React.FC = () => {
  const { incidents: sharedIncidents } = useIncidents();
  const [tickets, setTickets] = useState<KanbanTicket[]>([]);

  const loadTickets = async () => {
    const mapped = (sharedIncidents || []).map((inc: any) => ({
      id: inc.id,
      ticketNumber: inc.ticketId || inc.ticketNumber,
      title: inc.title,
      department: inc.department,
      priority: inc.priority || inc.severity,
      status: inc.kanbanStatus || "todo",
      timeLogged: inc.timeLogged,
      assignee: inc.assignee
    }));
    setTickets(mapped);
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

  const columns: { id: KanbanTicket["status"]; label: string; color: string; badge: string }[] = [
    { id: "todo", label: "Triage Queue", color: "border-amber-500/30 bg-amber-500/5", badge: "bg-amber-500/20 text-amber-400" },
    { id: "in_progress", label: "Field Units Dispatched", color: "border-blue-500/30 bg-blue-500/5", badge: "bg-blue-500/20 text-blue-400" },
    { id: "review", label: "AI Containment Review", color: "border-purple-500/30 bg-purple-500/5", badge: "bg-purple-500/20 text-purple-400" },
    { id: "completed", label: "Protocol Resolved", color: "border-emerald-500/30 bg-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-400" }
  ];

  const moveTicket = async (ticketId: string, nextStatus: KanbanTicket["status"]) => {
    try {
      // Optimistically update the UI
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: nextStatus } : t));
      
      const res = await fetch(`/api/incidents/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      
      // Update with server returned data
      setTickets(prev => prev.map(t => t.id === ticketId ? { 
        ...t, 
        status: updated.kanbanStatus, 
        priority: updated.priority || updated.severity,
        title: updated.title,
        department: updated.department,
        assignee: updated.assignee
      } : t));
      window.dispatchEvent(new CustomEvent("incidents:changed"));
    } catch {
      loadTickets(); // rollback
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Autonomous Incident Command Center
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Critical: {tickets.filter(t => t.priority === "Critical" && t.status !== "completed").length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Active: {tickets.filter(t => t.status !== "completed").length}</span>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colTickets = tickets.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 flex flex-col h-[620px]">
              {/* Column Header */}
              <div className="flex items-center justify-between p-2 pb-3 border-b border-slate-800/80 mb-3">
                <span className="font-display font-bold text-xs text-slate-200 tracking-wider uppercase flex items-center gap-2">
                  <span>{col.label}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
                    {colTickets.length}
                  </span>
                </span>
              </div>

              {/* Ticket Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-600 p-4 rounded-2xl shadow-lg transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-blue-400 font-bold">{ticket.ticketNumber}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{ticket.timeLogged}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteTicket(ticket.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                          aria-label="Delete incident"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-semibold text-xs text-white leading-snug group-hover:text-blue-300 transition-colors">
                      {ticket.title}
                    </h4>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <img src={ticket.assignee} alt="Worker" className="w-5 h-5 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-mono text-slate-400">{ticket.department}</span>
                      </div>

                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        ticket.priority === "Critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        ticket.priority === "High" ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>

                    {/* Quick Move Status Buttons */}
                    <div className="pt-2 flex items-center justify-between gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {col.id !== "todo" && (
                        <button
                          onClick={() => moveTicket(ticket.id, col.id === "completed" ? "review" : col.id === "review" ? "in_progress" : "todo")}
                          className="text-[10px] font-mono text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-md transition-colors"
                        >
                          ← Prev
                        </button>
                      )}
                      {col.id !== "completed" && (
                        <button
                          onClick={() => moveTicket(ticket.id, col.id === "todo" ? "in_progress" : col.id === "in_progress" ? "review" : "completed")}
                          className="text-[10px] font-mono text-blue-400 hover:text-white bg-blue-950/60 border border-blue-800/40 px-2 py-1 rounded-md ml-auto transition-colors flex items-center gap-1"
                        >
                          <span>Advance Protocol</span> →
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colTickets.length === 0 && (
                  <div className="h-40 border-2 border-dashed border-slate-800/80 rounded-2xl flex items-center justify-center text-center text-slate-600 font-mono text-[11px]">
                    No tickets in queue
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
