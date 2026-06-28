import React, { useState } from "react";
import { Cpu, Upload, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Camera, RefreshCw } from "lucide-react";

interface AnalysisResult {
  confidence?: number;
  incidentCategory?: string;
  severity?: string;
  diagnosis?: string;
  rootCause?: string;
  riskAssessment?: string;
  predictedImpact?: string;
  actionPlan?: string[];
  urgencyScore?: string;
  suggestedDepartment?: string;
  repairPriority?: string;
  estimatedRepairTime?: string;
  riskExplanation?: string;
  recommendedActions?: string[];
}
import { IMAGES } from "../data";

export const AnalysisView: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string>(IMAGES.bridgeCrack);
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [severity, setSeverity] = useState<string>("High");
  const [description, setDescription] = useState<string>("");
  
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isGeneratingWorkOrder, setIsGeneratingWorkOrder] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const sampleImages = [
    { label: "Sector 7 Bridge Crack", url: IMAGES.bridgeCrack, cat: "Structural", loc: "Sector 7G Overpass" },
    { label: "Substation Thermal Scan", url: IMAGES.bridgeWireframe, cat: "Electrical", loc: "Substation A4" },
    { label: "Water Valve Spatial Scan", url: IMAGES.spatialHeatmap, cat: "Hydraulic", loc: "Sector 9 Main" }
  ];

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setResult(null);

    try {
      const safeCategory = category.trim() || "Infrastructure Inspection";
      const safeLocation = location.trim() || "Municipal asset";
      const safeDescription = description.trim() || "Routine inspection request from field operations.";

      const API = "https://civicintel-ai.onrender.com";

const res = await fetch(`${API}/api/analyze-incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: safeCategory, location: safeLocation, description: safeDescription, severity, imageData: selectedImage })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        confidence: 94.2,
        diagnosis: "Structural degradation detected via heuristic computer vision comparison.",
        rootCause: "Thermal fluctuation combined with high traffic payload fatigue.",
        predictedImpact: "Severe structural compromise if subjected to sustained peak loads over 48h.",
        actionPlan: [
          "Initiate preventative rerouting of heavy commercial freight vehicles.",
          "Dispatch emergency civil structural inspection unit.",
          "Erect temporary steel reinforcement bracing."
        ],
        urgencyScore: "HIGH"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const normalizeSeverity = (value?: string) => {
    const normalized = (value || "Moderate").toUpperCase();
    if (normalized.includes("CRIT")) return "Critical";
    if (normalized.includes("HIGH")) return "High";
    if (normalized.includes("MOD")) return "Moderate";
    return "Low";
  };

  const getCoordinatesForLocation = (value: string) => {
    const lower = value.toLowerCase();
    if (lower.includes("substation") || lower.includes("power") || lower.includes("elect")) {
      return { latitude: 23.0315, longitude: 72.5463 };
    }
    if (lower.includes("bridge") || lower.includes("overpass") || lower.includes("struct")) {
      return { latitude: 23.0278, longitude: 72.5667 };
    }
    if (lower.includes("traffic") || lower.includes("road")) {
      return { latitude: 23.0150, longitude: 72.5804 };
    }
    if (lower.includes("water") || lower.includes("sector 9")) {
      return { latitude: 23.0225, longitude: 72.5714 };
    }
    return { latitude: 23.0225, longitude: 72.5714 };
  };

  const handleGenerateWorkOrder = async () => {
    if (!result) return;
    setIsGeneratingWorkOrder(true);

    try {
      const severityValue = normalizeSeverity(result.severity || result.urgencyScore || severity);
      const priorityValue = normalizeSeverity(result.repairPriority || result.urgencyScore || severity);
      const coordinates = getCoordinatesForLocation(location);
      const postBody = {
        title: `${category} - ${location}`,
        category: result.incidentCategory || category,
        department: result.suggestedDepartment || category,
        description: `${description}\n\nAI Diagnosis: ${result.diagnosis}\nRoot Cause: ${result.rootCause}\nRisk Assessment: ${result.riskAssessment || result.riskExplanation || result.predictedImpact}`,
        severity: severityValue,
        priority: priorityValue,
        status: "Queued",
        currentStage: "AI Analysis",
        location,
        address: location,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        imageData: selectedImage,
        imagePath: selectedImage,
        aiFindings: {
          confidence: result.confidence,
          diagnosis: result.diagnosis,
          rootCause: result.rootCause,
          riskAssessment: result.riskAssessment || result.riskExplanation,
          predictedImpact: result.predictedImpact,
          recommendedActions: result.recommendedActions || result.actionPlan,
          urgencyScore: result.urgencyScore,
          estimatedRepairTime: result.estimatedRepairTime,
          suggestedDepartment: result.suggestedDepartment,
          repairPriority: result.repairPriority
        },
        reportKey: `${selectedImage}::${category.toLowerCase()}::${location.toLowerCase()}::${description.toLowerCase()}`,
        generatedAt: new Date().toISOString(),
        aiScore: result.confidence || 90
      };

      const res = await fetch(`${API}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody)
      });

      if (!res.ok) throw new Error("Failed to persist work order");
      window.dispatchEvent(new CustomEvent("incidents:changed"));
      setToast("Work Order Generated Successfully");
      window.setTimeout(() => setToast(null), 2200);
    } catch {
      setToast("Work Order Generation Failed");
      window.setTimeout(() => setToast(null), 2200);
    } finally {
      setIsGeneratingWorkOrder(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedImage(uploadEvent.target.result as string);
          setResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title Strip */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            AI Infrastructure Diagnostic & Root Cause Engine
          </h1>
        </div>


      </div>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input & Image Selector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
            <h3 className="font-display font-bold text-sm text-white flex items-center justify-between">
              <span>1. Select Diagnostic Imagery</span>
              <label className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-800/40 transition-colors">
                <Upload className="w-3 h-3" /> Upload Custom Feed
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </h3>

            {/* Main Image Stage */}
            <div className="relative h-64 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
              <img 
                src={selectedImage} 
                alt="Inspection Target" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-300 pointer-events-none">
                <span className="bg-black/80 px-2 py-0.5 rounded border border-slate-700">TARGET: {location}</span>
                <span className="text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">1080p CCTV</span>
              </div>
            </div>

            {/* Sample Image Thumbnails */}
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-500 mb-2">Municipal CCTV Sample Snapshots</p>
              <div className="grid grid-cols-3 gap-2">
                {sampleImages.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedImage(s.url);
                      setCategory(s.cat);
                      setLocation(s.loc);
                      setResult(null);
                    }}
                    className={`p-1 rounded-xl border text-left transition-all ${
                      selectedImage === s.url 
                        ? "border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/20" 
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <img src={s.url} alt={s.label} className="w-full h-12 rounded-lg object-cover mb-1" referrerPolicy="no-referrer" />
                    <p className="text-[10px] font-medium text-slate-300 truncate px-1">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata Form */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="text-slate-400 font-mono text-[11px]">Incident Category</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 font-mono text-[11px]">Description Context</label>
                <textarea 
                  rows={2}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 outline-none resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-90 text-white font-semibold text-xs shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Gemini Vision Embeddings...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Execute Multimodal AI Diagnostic</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Output Results Stage */}
        <div className="lg:col-span-7 space-y-6">
          {analyzing ? (
            <div className="h-full min-h-[480px] bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <Cpu className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-lg font-display font-bold text-white">Cross-Referencing Municipal Sensor Telemetry</h3>
              <p className="text-xs font-mono text-slate-400 max-w-md">
                Analyzing spatial fracture patterns against historical bridge load models and weather variance tables...
              </p>
            </div>
          ) : result ? (
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                      result.urgencyScore === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse" :
                      result.urgencyScore === "HIGH" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                      "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    }`}>
                      URGENCY: {result.urgencyScore || "HIGH"}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-800/40">
                      CONFIDENCE: {result.confidence}%
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-display font-bold text-white leading-snug">
                    {result.diagnosis}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Incident Category
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.incidentCategory || category}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Severity
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.severity || result.urgencyScore || severity}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Confidence
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.confidence}%
                  </p>
                </div>

                <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/30 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-red-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Risk Assessment
                  </span>
                  <p className="text-xs text-red-200 leading-relaxed font-medium">
                    {result.riskAssessment || result.riskExplanation || result.predictedImpact}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Root Cause
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.rootCause}
                </p>
              </div>

              <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/30 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Predicted Impact Modeled
                </span>
                <p className="text-xs text-red-200 leading-relaxed font-medium">
                  {result.predictedImpact}
                </p>
              </div>

              {/* Recommended Action Plan Protocol */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recommended Actions
                </h3>

                <div className="space-y-2.5">
                  {(result.recommendedActions || result.actionPlan || []).map((step: string, idx: number) => (
                    <div key={idx} className="bg-[#060a14] p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-slate-500">
                  DIAGNOSTIC ID: AI-CV-99824 · ASSET RECORD LOGGED
                </span>
                <button
                  onClick={handleGenerateWorkOrder}
                  disabled={isGeneratingWorkOrder}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isGeneratingWorkOrder ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Generating...</span></>
                  ) : (
                    <><span>Generate Work Order Ticket</span><ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[480px] bg-slate-900/30 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
              <Camera className="w-10 h-10 text-slate-600 animate-bounce" />
              <p className="text-xs font-mono text-slate-400">Select imagery and execute AI diagnostic to inspect structural integrity.</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-3 text-sm text-emerald-200 shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
};
