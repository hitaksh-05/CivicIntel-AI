import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Layers,
  Navigation,
  ArrowRight,
  Droplets,
  Zap,
  Car
} from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { IMAGES } from "../data";
import { IncidentMarker, NavTab } from "../types";
import { useIncidents } from "../hooks/useIncidents";

interface MapViewProps {
  selectedIncidentId: string | null;
  onSelectIncident: (id: string | null) => void;
  onNavigate: (tab: NavTab) => void;
}

interface MapControllerProps {
  activeIncident: IncidentMarker | null;
  focusVersion: number;
}

const DEFAULT_MAP_CENTER: [number, number] = [23.0225, 72.5714];

const MapController: React.FC<MapControllerProps> = ({ activeIncident, focusVersion }) => {
  const map = useMap();

  useEffect(() => {
    if (activeIncident) {
      const position = getIncidentCoordinates(activeIncident);
      if (position) {
        map.flyTo(position, 13, {
          duration: 1.2,
          animate: true
        });
      }
    }
  }, [activeIncident, focusVersion, map]);

  return null;
};

const MapBoundsController: React.FC<{ incidents: IncidentMarker[] }> = ({ incidents }) => {
  const map = useMap();

  useEffect(() => {
    const points = incidents
      .map((incident) => getIncidentCoordinates(incident))
      .filter((point): point is [number, number] => Boolean(point));

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
      return;
    }

    map.setView(DEFAULT_MAP_CENTER, 12);
  }, [incidents, map]);

  return null;
};

const getIncidentCoordinates = (incident: IncidentMarker): [number, number] | null => {
  if (typeof incident.latitude === "number" && typeof incident.longitude === "number") {
    return [incident.latitude, incident.longitude] as [number, number];
  }

  return null;
};

const createMarkerIcon = (incident: IncidentMarker, isSelected: boolean) => {
  const color = incident.status === "Resolved"
    ? "#22c55e"
    : incident.status === "Repairing"
      ? "#3b82f6"
      : incident.severity === "Critical"
        ? "#ef4444"
        : "#f59e0b";
  const size = isSelected ? 34 : 28;

  return L.divIcon({
    html: `<div style="background:${color};width:${size}px;height:${size}px;border:2px solid white;box-shadow:0 0 0 6px ${isSelected ? "rgba(59,130,246,0.2)" : "rgba(2,6,23,0.15)"};border-radius:9999px;"></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const MapView: React.FC<MapViewProps> = ({ selectedIncidentId, onSelectIncident, onNavigate }) => {
  const { incidents: sharedIncidents } = useIncidents();
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [showHeatmapLayer, setShowHeatmapLayer] = useState<boolean>(true);
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [focusVersion, setFocusVersion] = useState<number>(0);

  useEffect(() => {
    setIncidents(sharedIncidents as IncidentMarker[]);
  }, [sharedIncidents]);

  const categories = ["All", "Water & Sewage", "Electricity & Power", "Roads & Transit", "Structural & Bridges", "Public Safety"];

  const filteredIncidents = incidents.filter((inc) => {
    if (!showResolved && inc.status === "Resolved") return false;
    return filterCategory === "All" || inc.category === filterCategory;
  });

  const activeIncident = filteredIncidents.find((inc) => inc.id === selectedIncidentId) || filteredIncidents[0] || null;
  const activeIncidentPosition = activeIncident ? getIncidentCoordinates(activeIncident) : null;

  const focusIncident = (incident: IncidentMarker | null) => {
    if (!incident) return;
    onSelectIncident(incident.id);
    setFocusVersion((value) => value + 1);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2">
            Live Municipal Telemetry & GIS Network Map
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              LIVE SENSORS
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Sector 1 through Sector 9 real-time spatial anomaly grid
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#050914] p-1 rounded-xl border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowResolved((value) => !value)}
            className={`px-3 py-2 rounded-xl text-xs font-mono border flex items-center gap-1.5 transition-all ${
              showResolved
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{showResolved ? "Showing Resolved" : "Show Resolved"}</span>
          </button>

          <button
            onClick={() => setShowHeatmapLayer(!showHeatmapLayer)}
            className={`px-3 py-2 rounded-xl text-xs font-mono border flex items-center gap-1.5 transition-all ${
              showHeatmapLayer
                ? "bg-purple-950/40 border-purple-500/50 text-purple-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AI Risk Overlay</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative h-[560px] shadow-2xl">
          <MapContainer center={DEFAULT_MAP_CENTER} zoom={12} scrollWheelZoom className="h-full w-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsController incidents={filteredIncidents} />
            <MapController activeIncident={activeIncident} focusVersion={focusVersion} />
            {filteredIncidents.map((marker) => {
              const isSelected = activeIncident?.id === marker.id;
              const position = getIncidentCoordinates(marker);
              if (!position) return null;
              return (
                <Marker
                  key={marker.id}
                  position={position}
                  icon={createMarkerIcon(marker, isSelected)}
                  eventHandlers={{ click: () => focusIncident(marker) }}
                />
              );
            })}
          </MapContainer>

          {showHeatmapLayer && (
            <div className="absolute inset-0 bg-red-600/10 pointer-events-none" />
          )}

          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl flex items-center gap-4 text-[11px] font-mono text-slate-300 z-20">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Critical Alert
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Investigating / High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Repairing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved
            </span>
          </div>

          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl text-slate-400 font-mono text-[10px] flex items-center gap-2 z-20">
            <Navigation className="w-3.5 h-3.5 text-blue-400 transform -rotate-45" />
            <span>
              {activeIncidentPosition
                ? `GIS COORDINATES: ${activeIncidentPosition[0].toFixed(4)}° N, ${Math.abs(activeIncidentPosition[1]).toFixed(4)}° E`
                : "GIS COORDINATES: CITY CENTER • LIVE FEED"}
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between space-y-6">
          {activeIncident ? (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                    {activeIncident.ticketId}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{activeIncident.status}</span>
                </div>
                <button type="button" onClick={() => focusIncident(activeIncident)} className="text-left w-full">
                  <h2 className="text-xl font-display font-bold text-white">{activeIncident.title}</h2>
                  <p className="text-xs font-mono text-blue-400 mt-1">{activeIncident.category}</p>
                </button>
              </div>

              <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-800">
                <img
                  src={IMAGES.locatorMap}
                  alt="Sector Locator Map"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-400">
                  SECTOR GRID
                </div>
              </div>

              <div className="bg-[#050914] p-4 rounded-2xl border border-slate-800/80 space-y-3 font-mono text-xs">
                {activeIncident.pressureLoss && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pressure Drop:</span>
                    <span className="text-red-400 font-bold">{activeIncident.pressureLoss}</span>
                  </div>
                )}
                {activeIncident.affectedUnits && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Affected Citizens:</span>
                    <span className="text-amber-400 font-bold">{activeIncident.affectedUnits}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400">Address:</span>
                  <span className="text-blue-400 break-words">{activeIncident.address || "Location data pending sync"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="text-blue-400">
                    {typeof activeIncident.latitude === "number" && typeof activeIncident.longitude === "number"
                      ? `${activeIncident.latitude.toFixed(5)}, ${activeIncident.longitude.toFixed(5)}`
                      : "Pending sync"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Unit:</span>
                  <span className="text-blue-400">{activeIncident.unitEnRoute || "Automated Sensor"}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeIncident.description}
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => focusIncident(activeIncident)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Focus on Map</span>
                  <Navigation className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate("analysis")}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
                >
                  Run Deep AI Root Cause Analysis
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              Select a telemetry anomaly marker on the GIS map to inspect live sensor feeds.
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>AUTOMATED VALVE CONTAINMENT</span>
            <span className="text-emerald-400">READY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
