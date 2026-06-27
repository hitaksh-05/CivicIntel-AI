import React, { useState, useEffect } from "react";
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Zap,
  Droplets,
  Car
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { NavTab } from "../types";
import { getIncidentMetrics } from "../utils/incidentStats";
import { useIncidents } from "../hooks/useIncidents";

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectIncident: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectIncident }) => {
  const { incidents, loading } = useIncidents();
  const [dashboardData, setDashboardData] = useState<any>({
    infrastructureHealth: 0,
    activeIncidentsCount: 0,
    criticalAlerts: [],
    departments: [],
    kpis: [],
    charts: [],
    stats: {
      totalIncidents: 0,
      criticalIncidents: 0,
      highPriorityIncidents: 0,
      repairingIncidents: 0,
      resolvedIncidents: 0,
      openIncidents: 0
    },
    riskIndex: 0.05
  });

  const buildDashboardData = (incidents: any[]) => {
    const metrics = getIncidentMetrics(incidents);

    return {
      infrastructureHealth: metrics.infrastructureHealth,
      activeIncidentsCount: metrics.activeIncidents.length,
      criticalAlerts: metrics.criticalAlerts,
      departments: metrics.departmentSummary,
      kpis: [
        {
          label: "Total Incidents",
          value: metrics.totalIncidents.toString(),
          unit: "tickets",
          status: "normal",
          change: `${metrics.resolvedIncidents} resolved`
        },
        {
          label: "Critical Incidents",
          value: metrics.criticalIncidents.length.toString(),
          unit: "alerts",
          status: metrics.criticalIncidents.length > 0 ? "critical" : "normal",
          change: `${metrics.highPriorityIncidents.length} high priority`
        },
        {
          label: "Open Incidents",
          value: metrics.openIncidents.length.toString(),
          unit: "active",
          status: metrics.openIncidents.length > 0 ? "warning" : "normal",
          change: `${metrics.repairingIncidents.length} repairing`
        }
      ],
      charts: metrics.dailyTrend,
      stats: {
        totalIncidents: metrics.totalIncidents,
        criticalIncidents: metrics.criticalIncidents.length,
        highPriorityIncidents: metrics.highPriorityIncidents.length,
        repairingIncidents: metrics.repairingIncidents.length,
        resolvedIncidents: metrics.resolvedIncidents.length,
        openIncidents: metrics.openIncidents.length
      },
      riskIndex: metrics.riskIndex,
      recentIncidents: metrics.recentIncidents.map((incident: any) => ({
        id: incident.id,
        title: incident.title,
        department: incident.department || incident.category || "General",
        severity: incident.severity || incident.priority || "Moderate",
        status: incident.status || incident.kanbanStatus || "Investigating"
      })),
      severityChartData: metrics.severityChartData,
      statusChartData: metrics.statusChartData
    };
  };

  useEffect(() => {
    setDashboardData(buildDashboardData(incidents));
  }, [incidents]);

  const { criticalAlerts, departments, kpis, charts, stats, riskIndex, recentIncidents, severityChartData, statusChartData } = dashboardData;
  const { totalIncidents, criticalIncidents, highPriorityIncidents, repairingIncidents, resolvedIncidents, openIncidents } = stats || {};

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Real-time Operations Executive Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("report")}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <span>+ Report Infrastructure Incident</span>
          </button>
          <button
            onClick={() => onNavigate("command")}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs transition-colors"
          >
            Command Center
          </button>
        </div>
      </div>

      {/* Live Systems KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {kpis.map((kpi: any, idx: number) => {
            const isPower = kpi.label.toLowerCase().includes("power");
            const isWater = kpi.label.toLowerCase().includes("water");
            const Icon = isPower ? Zap : isWater ? Droplets : Car;
            
            const isWarning = kpi.status === "warning";
            const isCritical = kpi.status === "critical";

            const borderHoverClass = isCritical ? "hover:border-red-500/40" : isWarning ? "hover:border-amber-500/40" : "hover:border-blue-500/40";
            const badgeBgClass = isCritical ? "bg-red-500/10 text-red-400 border border-red-500/20" : isWarning ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20";
            
            const changeIsNegative = kpi.change.toLowerCase().includes("down") || kpi.change.toLowerCase().includes("break") || kpi.change.toLowerCase().includes("drop");

            return (
              <div key={idx} className={`bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between transition-colors ${borderHoverClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <div className={`p-2 rounded-xl ${badgeBgClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-white mt-4">{kpi.value} <span className="text-sm font-normal text-slate-400">{kpi.unit}</span></p>
                  <p className="text-[11px] font-mono text-slate-400 mt-2 flex items-center gap-1">
                    {changeIsNegative ? (
                      <TrendingDown className={`w-3.5 h-3.5 ${isCritical || isWarning ? "text-red-400" : "text-emerald-400"}`} />
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className={isCritical || isWarning ? "text-red-400" : "text-slate-400"}>{kpi.change}</span>
                  </p>
                </div>
                <div className={`pt-3 border-t border-slate-800 text-[10px] font-mono ${isCritical || isWarning ? "text-red-400 font-semibold" : "text-slate-500"}`}>
                  {isCritical || isWarning ? "ALERT: ANOMALY MONITORING" : "SYSTEM OPERATIONAL"}
                </div>
              </div>
            );
          })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-white">Recent Incidents</h3>
            <span className="text-[10px] font-mono text-slate-400">Latest 5</span>
          </div>
          <div className="space-y-3">
            {recentIncidents?.length ? recentIncidents.map((incident: any) => (
              <button
                key={incident.id}
                onClick={() => onSelectIncident(incident.id)}
                className="w-full text-left rounded-xl border border-slate-800 bg-[#050914] p-3 transition-colors hover:border-blue-500/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{incident.title}</span>
                  <span className="text-[10px] font-mono uppercase text-slate-400">{incident.status}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{incident.department}</span>
                  <span className="text-slate-300">{incident.severity}</span>
                </div>
              </button>
            )) : (
              <div className="rounded-xl border border-slate-800 bg-[#050914] p-4 text-center text-xs text-slate-500 font-mono">
                No recent incidents available.
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-white">Incident Severity</h3>
            <span className="text-[10px] font-mono text-slate-400">Backend data</span>
          </div>
          {severityChartData?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#f8fafc" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl border border-slate-800 bg-[#050914] text-center text-xs text-slate-500 font-mono">
              No severity data available.
            </div>
          )}
        </div>

        <div className="xl:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-white">Incident Status</h3>
            <span className="text-[10px] font-mono text-slate-400">Backend data</span>
          </div>
          {statusChartData?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#f8fafc" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl border border-slate-800 bg-[#050914] text-center text-xs text-slate-500 font-mono">
              No status data available.
            </div>
          )}
        </div>
      </div>

      {/* Middle Grid: Critical System Alerts & Predictive Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Critical System Alerts */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Critical System Alerts ({criticalAlerts.length} Active)
              </h3>
              <button 
                onClick={() => onNavigate("map")}
                className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
              >
                View on map <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {criticalAlerts.length === 0 ? (
                <div className="bg-slate-950/20 border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-500 font-mono">
                  No active critical alerts.
                </div>
              ) : (
                criticalAlerts.map((alert: any) => {
                  const isWater = alert.category.toLowerCase().includes("water") || alert.title.toLowerCase().includes("water");
                  const alertBgClass = isWater ? "bg-red-950/20 border border-red-500/30 hover:bg-red-950/40 text-red-300" : "bg-purple-950/20 border border-purple-500/30 hover:bg-purple-950/40 text-purple-300";
                  
                  return (
                    <div 
                      key={alert.id}
                      onClick={() => {
                        if (alert.id.startsWith("inc_bridge") || alert.category.toLowerCase().includes("struct")) {
                          onNavigate("analysis");
                        } else {
                          onSelectIncident(alert.id);
                        }
                      }}
                      className={`${alertBgClass} p-4 rounded-xl cursor-pointer transition-all group`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            isWater ? "bg-red-500/20 text-red-300" : "bg-purple-500/20 text-purple-300"
                          }`}>
                            {alert.ticketId} · {alert.category.toUpperCase()}
                          </span>
                          <h4 className="font-semibold text-sm text-white group-hover:text-red-300 transition-colors pt-1">
                            {alert.title}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-3 pt-2 border-t ${isWater ? "border-red-500/20" : "border-purple-500/20"} flex items-center justify-between text-[10px] font-mono`}>
                        <span className="text-amber-400 font-semibold">{alert.unitEnRoute.toUpperCase()}</span>
                        <span className="text-slate-400">{alert.status.toUpperCase()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#050914] p-3 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Automated Containment Protocols:</span>
            <span className="text-emerald-400 font-semibold">STANDBY</span>
          </div>
        </div>

        {/* Predictive Analytics Graph */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-white">
                  24-Hour Predictive Infrastructure Telemetry
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Incident volume and critical-ticket concentration over the last seven days
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> New Incidents
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block" /> Critical
                </span>
              </div>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="congGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px", color: "#f8fafc" }}
                  />
                  <Area type="monotone" dataKey="incidents" name="New Incidents" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#powerGrad)" />
                  <Area type="monotone" dataKey="critical" name="Critical Incidents" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#congGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>⚠️ MODEL INSIGHT: Sector stress telemetry models peak loads at 16:00 EST.</span>
            <button onClick={() => onNavigate("insights")} className="text-blue-400 hover:underline">Full forecast</button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Department Compliance & Risk Index */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-display font-bold text-sm text-white mb-4">
            Department Telemetry Sync Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.slice(0, 4).map((sub: any) => (
              <div key={sub.id} className="bg-[#050914] p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{sub.category}</span>
                  <p className="font-semibold text-sm text-white mt-1">{sub.name}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">{sub.health}%</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    sub.status === "Optimal" ? "bg-emerald-500/20 text-emerald-400" :
                    sub.status === "Active Sync" || sub.status === "In Compliance" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Index Gauge */}
        <div className="lg:col-span-4 bg-linear-to-br from-slate-900 to-[#141b2d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              City Risk Index Gauge
            </span>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-display font-bold text-white">{(riskIndex || 0.05).toFixed(2)}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                SECURE THRESHOLD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-3 font-normal">
              Calculated via cross-department predictive failure correlation. Maximum secure limit is 0.45.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Automated Shedding:</span>
            <span className="text-emerald-400 font-semibold">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
