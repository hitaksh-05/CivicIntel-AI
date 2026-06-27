import React, { useState } from "react";
import { NavTab } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { CopilotDrawer } from "./components/CopilotDrawer";
import { LandingView } from "./components/LandingView";
import { DashboardView } from "./components/DashboardView";
import { MapView } from "./components/MapView";
import { AnalysisView } from "./components/AnalysisView";
import { ReportView } from "./components/ReportView";
import { CommandView } from "./components/CommandView";
import { InsightsView } from "./components/InsightsView";
import { TrackerView } from "./components/TrackerView";
import { IncidentProvider } from "./hooks/useIncidents";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("landing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>("m1");

  return (
    <IncidentProvider>
    <div className="flex h-screen bg-[#030712] text-slate-100 overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Infrastructure Module Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        unreadCount={4}
      />

      {/* Main Executive Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
          isCopilotOpen={isCopilotOpen}
        />

        <main className="flex-1 overflow-y-auto relative bg-gradient-to-b from-[#060a14] to-[#030712]">
          {activeTab === "landing" && (
            <LandingView onDeploy={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === "dashboard" && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectIncident={(id) => {
                setSelectedIncidentId(id);
              }}
            />
          )}

          {activeTab === "map" && (
            <MapView
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "analysis" && <AnalysisView />}

          {activeTab === "report" && <ReportView />}

          {activeTab === "command" && <CommandView />}

          {activeTab === "insights" && <InsightsView />}

          {activeTab === "tracker" && (
            <TrackerView onNavigate={(tab) => setActiveTab(tab)} />
          )}
        </main>
      </div>

      {/* Grounded AI Telemetry Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
    </IncidentProvider>
  );
}

export default App;
