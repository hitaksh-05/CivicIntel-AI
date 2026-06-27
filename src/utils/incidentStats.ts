export interface IncidentStatLike {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  title: string;
  category?: string;
  department?: string;
  severity?: string;
  priority?: string;
  status?: string;
  kanbanStatus?: string;
  description?: string;
  unitEnRoute?: string;
  affectedUnits?: string;
  pressureLoss?: string;
  generatedAt?: string;
  timeLogged?: string;
  assignee?: string;
  address?: string;
}

const normalizeDepartment = (incident: IncidentStatLike) => {
  const name = incident.department || incident.category || "General";
  const candidate = name.toLowerCase();
  if (/water|sewage|util/i.test(candidate)) return "Water & Sewage";
  if (/electric|power|energy|grid|substation/i.test(candidate)) return "Electricity & Power";
  if (/road|traffic|transport|transit|lane|signal/i.test(candidate)) return "Roads & Transit";
  if (/struct|bridge|overpass|weld|pylon|support/i.test(candidate)) return "Structural & Bridges";
  if (/public|safety|hazard|fire|police/i.test(candidate)) return "Public Safety";
  return name;
};

const normalizeSeverity = (incident: IncidentStatLike) => {
  const value = (incident.severity || incident.priority || "Moderate").toString();
  const normalized = value.toLowerCase();
  if (normalized.includes("crit")) return "Critical";
  if (normalized.includes("high")) return "High";
  if (normalized.includes("mod")) return "Moderate";
  return "Low";
};

const normalizeStatus = (incident: IncidentStatLike) => {
  const explicit = (incident.status || "").toString();
  if (explicit) return explicit;
  if (incident.kanbanStatus === "completed") return "Resolved";
  if (incident.kanbanStatus === "in_progress") return "Repairing";
  return "Investigating";
};

export const getIncidentMetrics = (incidents: IncidentStatLike[]) => {
  const normalizedIncidents = incidents.map((incident) => ({
    ...incident,
    department: normalizeDepartment(incident),
    severity: normalizeSeverity(incident),
    status: normalizeStatus(incident)
  }));

  const activeIncidents = normalizedIncidents.filter((incident) => incident.status !== "Resolved" && incident.kanbanStatus !== "completed");
  const criticalIncidents = normalizedIncidents.filter((incident) => incident.severity === "Critical");
  const highPriorityIncidents = normalizedIncidents.filter((incident) => incident.severity === "High" || incident.priority === "High");
  const repairingIncidents = normalizedIncidents.filter((incident) => incident.status === "Repairing" || incident.kanbanStatus === "in_progress" || incident.kanbanStatus === "review");
  const resolvedIncidents = normalizedIncidents.filter((incident) => incident.status === "Resolved" || incident.kanbanStatus === "completed");
  const openIncidents = normalizedIncidents.filter((incident) => incident.status !== "Resolved" && incident.kanbanStatus !== "completed");

  const departmentCounts = normalizedIncidents.reduce((acc, incident) => {
    const name = incident.department || "General";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentSummary = Object.entries(departmentCounts).map(([name, count]) => {
    const departmentIncidents = normalizedIncidents.filter((incident) => (incident.department || "General") === name);
    const openCount = departmentIncidents.filter((incident) => incident.status !== "Resolved" && incident.kanbanStatus !== "completed").length;
    const resolvedCount = departmentIncidents.filter((incident) => incident.status === "Resolved" || incident.kanbanStatus === "completed").length;
    const criticalCount = departmentIncidents.filter((incident) => incident.severity === "Critical").length;
    const severityPenalty = criticalCount * 18 + (departmentIncidents.some((incident) => incident.severity === "High") ? 8 : 0);
    const volumePenalty = Math.min(24, openCount * 4);
    const health = Math.max(18, Math.min(100, 100 - severityPenalty - volumePenalty + (resolvedCount > 0 ? 4 : 0)));
    let status = "Active Sync";
    if (criticalCount > 0) status = "Critical";
    else if (openCount === 0) status = "Optimal";
    return {
      id: name,
      name,
      category: name,
      health,
      status,
      openIncidents: openCount,
      completedIncidents: resolvedCount,
      count
    };
  });

  const severityCounts = normalizedIncidents.reduce((acc, incident) => {
    const severity = incident.severity || "Moderate";
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = normalizedIncidents.reduce((acc, incident) => {
    const status = incident.status || "Investigating";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dailyTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const label = date.toLocaleDateString("en", { month: "short", day: "numeric" });
    const incidentsForDay = normalizedIncidents.filter((incident) => {
      const incidentDate = incident.generatedAt || incident.timeLogged;
      if (!incidentDate) return false;
      return incidentDate.slice(0, 10) === date.toISOString().slice(0, 10);
    });
    const criticalForDay = incidentsForDay.filter((incident) => incident.severity === "Critical").length;
    return {
      time: label,
      incidents: incidentsForDay.length,
      critical: criticalForDay
    };
  });

  const criticalAlerts = activeIncidents
    .filter((incident) => incident.severity === "Critical" || incident.severity === "High")
    .map((incident) => ({
      id: incident.id,
      ticketId: incident.ticketId || `#CIV-${incident.id}`,
      title: incident.title,
      category: incident.category || "General",
      description: incident.description || "Active incident requires immediate attention.",
      status: incident.status,
      unitEnRoute: incident.unitEnRoute || "Automated containment engaged",
      affectedUnits: incident.affectedUnits || "Local area",
      pressureLoss: incident.pressureLoss
    }));

  const recentIncidents = [...normalizedIncidents]
    .sort((a, b) => {
      const aTime = new Date(a.generatedAt || a.timeLogged || 0).getTime();
      const bTime = new Date(b.generatedAt || b.timeLogged || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  const riskIndex = Math.min(0.45, Math.max(0.05, criticalIncidents.length * 0.08 + highPriorityIncidents.length * 0.03 + openIncidents.length * 0.01));
  const infrastructureHealth = Math.max(0, Math.min(100, 100 - activeIncidents.length * 3 - criticalIncidents.length * 4));

  return {
    totalIncidents: normalizedIncidents.length,
    activeIncidents,
    criticalIncidents,
    highPriorityIncidents,
    repairingIncidents,
    resolvedIncidents,
    openIncidents,
    departmentSummary,
    severityChartData: Object.entries(severityCounts).map(([name, value]) => ({ name, value })),
    statusChartData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    dailyTrend,
    criticalAlerts,
    recentIncidents,
    riskIndex,
    infrastructureHealth
  };
};

export const getInsightsMetrics = (incidents: IncidentStatLike[]) => {
  const normalizedIncidents = incidents.map((incident) => ({
    ...incident,
    department: normalizeDepartment(incident),
    severity: normalizeSeverity(incident),
    status: normalizeStatus(incident)
  }));

  const activeIncidents = normalizedIncidents.filter((incident) => incident.status !== "Resolved" && incident.kanbanStatus !== "completed");
  const criticalIncidents = activeIncidents.filter((incident) => incident.severity === "Critical");
  const highPriorityIncidents = activeIncidents.filter((incident) => incident.severity === "High" || incident.priority === "High");
  const trafficIncidents = activeIncidents.filter((incident) => /traffic|road|transport|lane|signal/i.test(`${incident.title} ${incident.description} ${incident.category} ${incident.department}`));
  const waterIncidents = activeIncidents.filter((incident) => /water|pipe|main|sewer|drain/i.test(`${incident.title} ${incident.description} ${incident.category} ${incident.department}`));
  const structuralIncidents = activeIncidents.filter((incident) => /struct|bridge|weld|overpass|pylon|support/i.test(`${incident.title} ${incident.description} ${incident.category} ${incident.department}`));

  const departmentNames = Array.from(new Set(activeIncidents.map((incident) => incident.department || incident.category || "General")));
  const predictiveBarData = departmentNames.map((name) => {
    const departmentIncidents = activeIncidents.filter((incident) => (incident.department || incident.category || "General") === name);
    const criticalCount = departmentIncidents.filter((incident) => incident.severity === "Critical").length;
    const openCount = departmentIncidents.length;
    const currentLoad = Math.min(100, 40 + openCount * 8 + criticalCount * 10 + (name.toLowerCase().includes("water") ? 4 : 0));
    const failureProb = Math.min(95, 12 + openCount * 6 + criticalCount * 15 + (name.toLowerCase().includes("water") ? 9 : 0));
    return { sector: name, currentLoad, failureProb };
  }).slice(0, 5);

  const subsystemRadarData = [
    { subject: "Power Grid", A: Math.max(40, 120 - activeIncidents.filter((incident) => /power|energy|elect/i.test(`${incident.title} ${incident.description}`)).length * 8), B: Math.min(150, 110 + criticalIncidents.filter((incident) => /power|energy|elect/i.test(`${incident.title} ${incident.description}`)).length * 8), fullMark: 150 },
    { subject: "Water Main", A: Math.max(42, 98 - waterIncidents.length * 5), B: Math.min(150, 110 + waterIncidents.length * 14), fullMark: 150 },
    { subject: "Transit Flow", A: Math.max(38, 86 - trafficIncidents.length * 4), B: Math.min(150, 108 + trafficIncidents.length * 12), fullMark: 150 },
    { subject: "Structural", A: Math.max(45, 99 - structuralIncidents.length * 6), B: Math.min(150, 105 + structuralIncidents.length * 12), fullMark: 150 },
    { subject: "Comms Net", A: Math.max(50, 140 - highPriorityIncidents.filter((incident) => /comm|network/i.test(`${incident.title} ${incident.description}`)).length * 10), B: Math.min(150, 95 + highPriorityIncidents.filter((incident) => /comm|network/i.test(`${incident.title} ${incident.description}`)).length * 10), fullMark: 150 },
    { subject: "Public Safety", A: Math.max(55, 135 - activeIncidents.filter((incident) => /safety|public/i.test(`${incident.title} ${incident.description}`)).length * 8), B: Math.min(150, 100 + activeIncidents.filter((incident) => /safety|public/i.test(`${incident.title} ${incident.description}`)).length * 10), fullMark: 150 }
  ];

  const riskProbability = Math.min(99, 20 + criticalIncidents.length * 14 + highPriorityIncidents.length * 6 + trafficIncidents.length * 4 + waterIncidents.length * 5);
  const predictedFailures = Math.max(1, criticalIncidents.length + Math.round((trafficIncidents.length + waterIncidents.length + structuralIncidents.length) / 2));
  const criticalInfrastructure = criticalIncidents.length + (waterIncidents.length > 0 ? 1 : 0) + (structuralIncidents.length > 0 ? 1 : 0);
  const trafficDisruption = trafficIncidents.length;
  const waterDisruption = waterIncidents.length;
  const riskLabel = departmentNames[0] ? `${departmentNames[0]} • ${Math.min(99, 45 + departmentNames.length * 8)}%` : "No active departments";
  const sectorLabel = predictiveBarData[0] ? `${predictiveBarData[0].sector} • ${predictiveBarData[0].failureProb}%` : "No active sectors";

  const risks = [
    trafficIncidents[0] ? {
      id: "traffic-risk",
      title: `Traffic disruption risk at ${trafficIncidents[0].department || "Transit"}`,
      badge: "🚦 TRAFFIC DISRUPTION RISK",
      description: `${trafficIncidents[0].title}: ${trafficIncidents[0].description || "Active transit disruption requires rerouting."}`,
      severity: trafficIncidents[0].severity === "Critical" ? "CRITICAL" : "HIGH",
      prob: Math.min(99, 60 + (trafficIncidents[0].severity === "Critical" ? 20 : 10)),
      recommendation: "Deploy Automated Signal Reroute Timing"
    } : {
      id: "traffic-risk",
      title: "Traffic disruption risk",
      badge: "🚦 TRAFFIC DISRUPTION RISK",
      description: "No active traffic incident is currently linked to the incident dataset.",
      severity: "HIGH",
      prob: 0,
      recommendation: "Deploy Automated Signal Reroute Timing"
    },
    waterIncidents[0] || structuralIncidents[0] || criticalIncidents[0] ? {
      id: "structure-risk",
      title: `Infrastructure reinforcement required for ${waterIncidents[0]?.department || structuralIncidents[0]?.department || criticalIncidents[0]?.department || "critical assets"}`,
      badge: "🔧 CRITICAL INFRASTRUCTURE RISK",
      description: `${waterIncidents[0]?.title || structuralIncidents[0]?.title || criticalIncidents[0]?.title || "Critical infrastructure"}: ${waterIncidents[0]?.description || structuralIncidents[0]?.description || criticalIncidents[0]?.description || "A high-severity incident requires immediate reinforcement."}`,
      severity: (waterIncidents[0]?.severity || structuralIncidents[0]?.severity || criticalIncidents[0]?.severity || "Critical").toUpperCase(),
      prob: Math.min(99, 55 + (waterIncidents[0] ? 18 : 10) + (structuralIncidents[0] ? 12 : 0)),
      recommendation: "Dispatch Ultrasonic Weld Reinforcement Unit"
    } : {
      id: "structure-risk",
      title: "Infrastructure reinforcement risk",
      badge: "🔧 CRITICAL INFRASTRUCTURE RISK",
      description: "No critical infrastructure incident is currently linked to the dataset.",
      severity: "CRITICAL",
      prob: 0,
      recommendation: "Dispatch Ultrasonic Weld Reinforcement Unit"
    }
  ].slice(0, 2);

  return {
    predictiveBarData,
    subsystemRadarData,
    risks,
    metrics: {
      riskProbability,
      departmentRisk: riskLabel,
      sectorRisk: sectorLabel,
      predictedFailures,
      criticalInfrastructure,
      trafficDisruption,
      waterDisruption
    }
  };
};
