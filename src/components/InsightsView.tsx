import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { getInsightsMetrics } from "../utils/incidentStats";
import { useIncidents } from "../hooks/useIncidents";

export const InsightsView: React.FC = () => {
  const { incidents: sharedIncidents } = useIncidents();
  const [predictionData, setPredictionData] = useState<any>({
    predictiveBarData: [],
    subsystemRadarData: [],
    risks: []
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("insights-executed-actions");
    return saved ? JSON.parse(saved) : [];
  });

  const buildPredictionData = (incidents: any[]) => {
    return getInsightsMetrics(incidents);
  };

  useEffect(() => {
    setPredictionData(buildPredictionData(sharedIncidents || []));
  }, [sharedIncidents]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const { predictiveBarData, subsystemRadarData, risks, metrics } = predictionData;

  const handleAction = async (risk: any) => {
    const actionKey = risk.recommendation.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (executedActions.includes(actionKey)) {
      setToastMessage(`${risk.recommendation} already executed.`);
      return;
    }

    const confirmed = window.confirm(`Execute ${risk.recommendation}?`);
    if (!confirmed) return;

    try {
      const res = await fetch("https://civicintel-ai.onrender.com/api/incidents");
      if (!res.ok) throw new Error("API error");
      const incidents = await res.json();
      const targetIncident = incidents.find((incident: any) => {
        const text = `${incident.title} ${incident.description} ${incident.category} ${incident.department}`.toLowerCase();
        return risk.recommendation.includes("Signal") ? /traffic|road|transport|signal/i.test(text) : /water|struct|bridge|weld|overpass|support/i.test(text);
      }) || incidents.find((incident: any) => incident.status !== "Resolved") || incidents[0];

      if (!targetIncident) throw new Error("No incident available");

      const timelineEntry = {
        timestamp: new Date().toISOString(),
        action: risk.recommendation,
        details: `${risk.recommendation} applied to ${targetIncident.ticketId || targetIncident.title}`
      };

      const updatePayload = {
        status: risk.recommendation.includes("Signal") ? "En Route" : "Repairing",
        kanbanStatus: risk.recommendation.includes("Signal") ? "in_progress" : "review",
        progress: risk.recommendation,
        currentStage: risk.recommendation,
        completionPercent: risk.recommendation.includes("Signal") ? 25 : 15,
        unitEnRoute: risk.recommendation.includes("Signal") ? "Signal reroute timing deployed" : "Ultrasonic weld reinforcement unit dispatched",
        timeline: [...(targetIncident.timeline || []), timelineEntry]
      };

      const API = "https://civicintel-ai.onrender.com";

const updateRes = await fetch(
  `${API}/api/incidents/${targetIncident.id}`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatePayload),
  }
);
      if (!updateRes.ok) throw new Error("Failed to update incident");

      const updatedActions = [...executedActions, actionKey];
      setExecutedActions(updatedActions);
      window.localStorage.setItem("insights-executed-actions", JSON.stringify(updatedActions));
      setToastMessage(`${risk.recommendation} executed successfully.`);
      window.dispatchEvent(new CustomEvent("incidents:changed"));
    } catch {
      setToastMessage("Action failed to execute.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {toastMessage ? (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 shadow-lg shadow-emerald-950/20">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Predictive Failure Modeling & Risk Matrix
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-300 font-mono text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>{metrics?.riskProbability || 0}% live incident risk probability</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Risk Probability", value: `${metrics?.riskProbability || 0}%` },
          { label: "Department Risk", value: metrics?.departmentRisk || "No data" },
          { label: "Sector Risk", value: metrics?.sectorRisk || "No data" },
          { label: "Predicted Failures", value: metrics?.predictedFailures || 0 }
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{metric.label}</p>
            <p className="mt-2 text-sm font-display font-bold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Critical Infrastructure", value: metrics?.criticalInfrastructure || 0 },
          { label: "Traffic Disruption", value: metrics?.trafficDisruption || 0 },
          { label: "Water Disruption", value: metrics?.waterDisruption || 0 }
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{metric.label}</p>
            <p className="mt-2 text-sm font-display font-bold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-1">Sector Stress vs. 48h Cascading Failure Probability (%)</h3>
            <p className="text-xs font-mono text-slate-400 mb-6">Live incident severity and open-ticket load across active departments</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={predictiveBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="sector" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px", color: "#f8fafc" }} />
                  <Bar dataKey="currentLoad" name="Current Stress %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failureProb" name="Failure Risk %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Live incident backlog drives the forecast model.</span>
            <span className="text-amber-400">ACTION RECOMMENDED</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-1">Multimodal Subsystem Equilibrium Matrix</h3>
            <p className="text-xs font-mono text-slate-400 mb-4">Live capacity vs. incident-driven demand pressure across the network</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subsystemRadarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 150]} />
                  <Radar name="Baseline Capacity" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="Peak Modeled Demand" dataKey="B" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", fontSize: "12px", color: "#f8fafc" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-xs font-mono text-purple-400 flex justify-between">
            <span>WATER / TRANSIT DEFICIT PREDICTED</span>
            <span>GAUGE: LIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {risks.map((risk: any) => {
          const isCritical = risk.severity === "CRITICAL" || risk.severity === "Critical";
          const borderClass = isCritical ? "border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-slate-900" : "border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-900";
          const badgeClass = isCritical ? "bg-purple-500/20 text-purple-300" : "bg-amber-500/20 text-amber-300";
          const btnClass = isCritical ? "bg-purple-600 hover:bg-purple-500" : "bg-amber-600 hover:bg-amber-500";
          const actionKey = risk.recommendation.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const alreadyExecuted = executedActions.includes(actionKey);

          return (
            <div key={risk.id} className={`${borderClass} border p-6 rounded-3xl space-y-3`}>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${badgeClass}`}>
                {risk.badge}
              </span>
              <h4 className="text-lg font-display font-bold text-white">{risk.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {risk.description}
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-slate-400">Probability {risk.prob || 0}%</span>
                <button
                  onClick={() => handleAction(risk)}
                  disabled={alreadyExecuted}
                  className={`px-4 py-2 rounded-xl text-white font-semibold text-xs transition-colors ${btnClass} ${alreadyExecuted ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {alreadyExecuted ? "Executed" : risk.recommendation}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
