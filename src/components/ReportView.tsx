import React, { useEffect, useRef, useState } from "react";
import { FileText, Upload, Send, CheckCircle2, MapPin, AlertTriangle, Building2, ShieldAlert, Navigation, Loader2 } from "lucide-react";

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

export const ReportView: React.FC = () => {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Water & Sewage");
  const [priority, setPriority] = useState<"Low" | "Moderate" | "High" | "Critical">("High");
  const [location, setLocation] = useState("Sector 9 / District 4 Junction");
  const [locationQuery, setLocationQuery] = useState("Sector 9 / District 4 Junction");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "info"; message: string } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = locationQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
        setFeedback({ type: "info", message: "Location suggestions are temporarily unavailable. You can continue with a manual address." });
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [locationQuery]);

  const selectSuggestion = (suggestion: GeocodeResult) => {
    setLocationQuery(suggestion.display_name);
    setLocation(suggestion.display_name);
    setAddress(suggestion.display_name);
    setLatitude(Number(suggestion.lat));
    setLongitude(Number(suggestion.lon));
    setSuggestions([]);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setLatitude(lat);
        setLongitude(lon);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const resolvedAddress = data.display_name || "Current location";
          setLocationQuery(resolvedAddress);
          setLocation(resolvedAddress);
          setAddress(resolvedAddress);
        } catch {
          const fallbackAddress = `Current location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
          setLocationQuery(fallbackAddress);
          setLocation(fallbackAddress);
          setAddress(fallbackAddress);
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        setIsGettingLocation(false);
        alert("Location access was denied. You can continue using manual search.");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFeedback({ type: "error", message: "Please add both a title and a description before dispatching the ticket." });
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: department,
          description,
          severity: priority,
          status: "Queued",
          currentStage: "Queued",
          location,
          address: address || location,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined
        })
      });
      if (!res.ok) throw new Error("Failed to submit incident");
      const data = await res.json();
      setCreatedTicketId(data.ticketId || data.ticketNumber || "#CIV-89021");
      window.dispatchEvent(new CustomEvent("incidents:changed"));
      setSubmitted(true);
    } catch {
      setFeedback({ type: "error", message: "The incident could not be dispatched right now. Please try again in a moment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-400" />
            Municipal Incident Reporting & Dispatch Portal
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Submit field disruption observations for immediate autonomous AI triage and kanban routing
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-white">Incident Ticket {createdTicketId} Dispatched</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your field report "{title}" has been verified by the Civic AI sensor net and assigned priority status <span className="font-bold text-amber-400">{priority.toUpperCase()}</span>.
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 max-w-lg mx-auto flex items-center justify-between">
            <span>AUTOMATED TRIAGE SEQUENCE:</span>
            <span className="text-emerald-400 font-bold">INITIATED</span>
          </div>
          <button
            onClick={() => {
              setTitle("");
              setDescription("");
              setSubmitted(false);
              setFileName(null);
              setCreatedTicketId("");
              setLocationQuery("");
              setLocation("");
              setAddress("");
              setLatitude(null);
              setLongitude(null);
            }}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Submit Another Field Report
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">Incident Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Broken Water Main Flooding Street"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">Affected Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
              >
                <option value="Water & Sewage">Water & Sewage</option>
                <option value="Electricity & Power">Electricity & Power</option>
                <option value="Roads & Transit">Roads & Transit</option>
                <option value="Structural & Bridges">Structural & Bridges</option>
                <option value="Public Safety">Public Safety</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">GIS Location / Landmark</label>
              <div className="relative" ref={searchRef}>
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={locationQuery}
                  onChange={(e) => {
                    setFeedback(null);
                    setLocationQuery(e.target.value);
                    setLocation(e.target.value);
                  }}
                  placeholder="Search for a landmark or address"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-blue-400 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
                )}
                {suggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/95 shadow-2xl overflow-hidden">
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.lat}-${suggestion.lon}-${suggestion.display_name}`}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800 border-b border-slate-800 last:border-b-0"
                      >
                        <span className="block text-white">{suggestion.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
                className="mt-2 inline-flex items-center gap-2 text-[11px] font-mono text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isGettingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                <span>Use Current Location</span>
              </button>
              {(latitude !== null && longitude !== null) && (
                <p className="text-[10px] font-mono text-emerald-400 mt-1">
                  Saved coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">Severity Tier</label>
              <div className="grid grid-cols-4 gap-2">
                {(["Low", "Moderate", "High", "Critical"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      priority === p
                        ? p === "Critical" ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30" :
                          p === "High" ? "bg-amber-600 border-amber-400 text-white" : "bg-blue-600 border-blue-400 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-slate-400">Detailed Description & Symptoms</label>
            <textarea
              required
              rows={4}
              placeholder="Describe observable pressure loss, structural fissures, traffic congestion, or electrical arcing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Drag & Drop File Upload Stage */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-slate-400">Field Telemetry Attachment (Drag & Drop or Click)</label>
            <label className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 bg-slate-950/60 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-blue-400 transition-colors mb-2" />
              <p className="text-xs text-slate-300 font-medium">
                {fileName ? <span className="text-emerald-400 font-bold">Attached: {fileName}</span> : "Drag & Drop field photography or log files here"}
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">Supports PNG, JPG, CSV, JSON telemetry feeds</p>
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-xl shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-55"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Dispatching..." : "Dispatch Automated Ticket"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
