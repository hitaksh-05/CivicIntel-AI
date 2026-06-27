import React from "react";
import { Activity, Shield, Cpu, Zap, ArrowRight, CheckCircle, BarChart3, Layers, Sparkles } from "lucide-react";
import { IMAGES } from "../data";
import { useIncidents } from "../hooks/useIncidents";
import { NavTab } from "../types";
import { getIncidentMetrics } from "../utils/incidentStats";

interface LandingViewProps {
  onDeploy: (tab: NavTab) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onDeploy }) => {
  const { incidents } = useIncidents();
  const metrics = React.useMemo(() => getIncidentMetrics(incidents || []), [incidents]);

  const heroStats = [
    {
      value: metrics.totalIncidents,
      label: "Total Incidents",
      description: `${metrics.openIncidents.length} currently active across ${metrics.departmentSummary.length} departments`,
      accentClass: "text-blue-400",
      glowClass: "bg-blue-500/5 group-hover:bg-blue-500/10"
    },
    {
      value: metrics.highPriorityIncidents.length,
      label: "High Priority Incidents",
      description: `${metrics.criticalIncidents.length} critical incidents require immediate response`,
      accentClass: "text-emerald-400",
      glowClass: "bg-emerald-500/5 group-hover:bg-emerald-500/10"
    },
    {
      value: metrics.departmentSummary.length,
      label: "Active Departments",
      description: `${metrics.resolvedIncidents.length} incidents resolved to date`,
      accentClass: "text-purple-400",
      glowClass: "bg-purple-500/5 group-hover:bg-purple-500/10"
    }
  ];

  return (
    <div className="min-h-full flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center pt-8 md:pt-16 max-w-4xl mx-auto space-y-6 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Next-Gen Municipal Operating System
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white leading-tight">
          The Intelligent <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Pulse</span> of the City.
        </h1>

        <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
          CivicIntel AI unifies power grids, water pressure telemetry, transit flows, and structural sensors into an autonomous, predictive incident command OS.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onDeploy("dashboard")}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2.5 group transition-all transform hover:-translate-y-0.5"
          >
            <span>Deploy CivicIntel OS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onDeploy("map")}
            className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm flex items-center gap-2 transition-all"
          >
            <Activity className="w-4 h-4 text-red-400 animate-pulse" />
            <span>View Live City Network Map</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
        {heroStats.map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl transition-colors ${stat.glowClass}`} />
            <p className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">{stat.value}</p>
            <p className={`text-sm font-semibold mt-1 ${stat.accentClass}`}>{stat.label}</p>
            <p className="text-xs text-slate-500 mt-2 font-mono">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Bento Grid Preview Features */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Core Operating System Architecture
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Feature 1 */}
          <div 
            onClick={() => onDeploy("analysis")}
            className="md:col-span-7 bg-gradient-to-br from-slate-900 to-[#0c1326] border border-slate-800 p-8 rounded-3xl cursor-pointer group hover:border-purple-500/50 transition-all flex flex-col justify-between overflow-hidden relative"
          >
            <div className="space-y-4 z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white group-hover:text-purple-300 transition-colors">
                Multimodal Structural Computer Vision
              </h3>
              <p className="text-slate-400 text-sm max-w-md">
                Upload bridge fissure photography or live CCTV feeds. Gemini 2.5 calculates micro-crack expansion rates and dispatches civil reinforcement teams.
              </p>
            </div>
            <div className="mt-8 relative h-48 rounded-2xl overflow-hidden border border-slate-800">
              <img 
                src={IMAGES.bridgeWireframe} 
                alt="Bridge Wireframe" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded bg-black/80 font-mono text-[11px] text-purple-400 border border-purple-500/30">
                STR-BRG-4011-B · 14% FATIGUE VARIANCE
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div 
            onClick={() => onDeploy("insights")}
            className="md:col-span-5 bg-gradient-to-br from-slate-900 to-[#0f172a] border border-slate-800 p-8 rounded-3xl cursor-pointer group hover:border-amber-500/50 transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white group-hover:text-amber-300 transition-colors">
                Predictive Failure Modeling
              </h3>
              <p className="text-slate-400 text-sm">
                Anticipate cascading failures before they occur. Our spatial logic heatmaps model water main reroute congestion 2 hours ahead of peak traffic.
              </p>
            </div>
            <div className="mt-8 relative h-48 rounded-2xl overflow-hidden border border-slate-800">
              <img 
                src={IMAGES.spatialHeatmap} 
                alt="Spatial Logic Heatmap" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded bg-black/80 font-mono text-[11px] text-amber-400 border border-amber-500/30">
                85% GRIDLOCK PROBABILITY DETECTED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
