import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface IncidentContextValue {
  incidents: any[];
  loading: boolean;
  refreshIncidents: () => Promise<void>;
}

const IncidentContext = createContext<IncidentContextValue>({
  incidents: [],
  loading: true,
  refreshIncidents: async () => undefined
});

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshIncidents = useCallback(async () => {
    try {
      const API =
  import.meta.env.VITE_API_URL || "https://civicintel-ai.onrender.com";

const res = await fetch(`${API}/api/incidents`);
      if (!res.ok) throw new Error("Failed to load incidents");
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshIncidents();

    const handleIncidentsChanged = () => {
      void refreshIncidents();
    };

    window.addEventListener("incidents:changed", handleIncidentsChanged);
    const interval = window.setInterval(() => {
      void refreshIncidents();
    }, 10000);

    return () => {
      window.removeEventListener("incidents:changed", handleIncidentsChanged);
      window.clearInterval(interval);
    };
  }, [refreshIncidents]);

  const value = useMemo(() => ({ incidents, loading, refreshIncidents }), [incidents, loading, refreshIncidents]);

  return React.createElement(IncidentContext.Provider, { value }, children);
};

export const useIncidents = () => useContext(IncidentContext);
