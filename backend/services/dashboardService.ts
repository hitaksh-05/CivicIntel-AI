import { readJSON } from "../utils/jsonHelper";
import { Incident, SubsystemStatus } from "../types";
import { GeminiService } from "./gemini";

export class DashboardService {
  static async getDashboardData(): Promise<any> {
    const incidents = await readJSON<Incident[]>("incidents.json");
    const departments = await readJSON<SubsystemStatus[]>("departments.json");
    const notifications = await readJSON<any>("notifications.json");

    const activeIncidentsList = incidents.filter((incident) => incident.status !== "Resolved" && incident.kanbanStatus !== "completed");
    const criticalIncidents = incidents.filter((incident) => incident.severity === "Critical").length;
    const highPriorityIncidents = incidents.filter((incident) => incident.severity === "High" || incident.priority === "High").length;
    const repairingIncidents = incidents.filter((incident) => incident.status === "Repairing").length;
    const resolvedIncidents = incidents.filter((incident) => incident.status === "Resolved").length;
    const openIncidents = incidents.filter((incident) => incident.status !== "Resolved").length;

    const severityCounts = incidents.reduce((acc, incident) => {
      const severity = incident.severity || "Moderate";
      acc[severity.toLowerCase()] = (acc[severity.toLowerCase()] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentSummary = incidents.reduce((acc, incident) => {
      const rawDepartment = incident.department || incident.category || "General";
      const normalizedDepartment = /water|sewage|util/i.test(rawDepartment)
        ? "Utilities"
        : /electric|power|energy/i.test(rawDepartment)
          ? "Energy"
          : /road|traffic|transport/i.test(rawDepartment)
            ? "Transport"
            : /public|safety/i.test(rawDepartment)
              ? "Public Safety"
              : /comm|network/i.test(rawDepartment)
                ? "Comms"
                : rawDepartment;

      acc[normalizedDepartment] = (acc[normalizedDepartment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const label = date.toLocaleDateString("en", { month: "short", day: "numeric" });
      const incidentsForDay = incidents.filter((incident) => {
        if (!incident.generatedAt) return false;
        const incidentDate = new Date(incident.generatedAt).toISOString().slice(0, 10);
        return incidentDate === date.toISOString().slice(0, 10);
      });
      const criticalForDay = incidentsForDay.filter((incident) => incident.severity === "Critical").length;
      return {
        time: label,
        incidents: incidentsForDay.length,
        critical: criticalForDay
      };
    });

    const departmentHealthBase = departments.reduce((acc, department) => {
      acc[department.name] = department.health;
      return acc;
    }, {} as Record<string, number>);

    const departmentHealth = Object.entries(departmentSummary).reduce((acc, [name, count]) => {
      const mappedName = name === "Utilities"
        ? "Utility Management"
        : name === "Energy"
          ? "Energy"
          : name === "Transport"
            ? "Transportation"
            : name === "Public Safety"
              ? "Public Safety"
              : name === "Comms"
                ? "Comms Network"
                : name;
      acc[name] = departmentHealthBase[mappedName] ?? 90;
      return acc;
    }, {} as Record<string, number>);

    const activePenalty = Math.min(20, criticalIncidents * 4 + highPriorityIncidents * 2 + openIncidents);
    const avgDepartmentHealth = Object.values(departmentHealth).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(departmentHealth).length);
    const infrastructureHealth = Math.max(0, Math.min(100, Math.round(avgDepartmentHealth - activePenalty / 2)));

    const criticalAlerts = activeIncidentsList
      .filter((incident) => incident.severity === "Critical" || incident.severity === "High")
      .map((incident) => ({
        id: incident.id,
        ticketId: incident.ticketId,
        title: incident.title,
        category: incident.category,
        description: incident.description,
        status: incident.status,
        unitEnRoute: incident.unitEnRoute || "Automated containment engaged",
        affectedUnits: incident.affectedUnits || "Local area",
        pressureLoss: incident.pressureLoss
      }));

    const departmentCards = Object.entries(departmentSummary).map(([name, count]) => {
      const mappedName = name === "Utilities"
        ? "Utility Management"
        : name === "Energy"
          ? "Energy"
          : name === "Transport"
            ? "Transportation"
            : name === "Public Safety"
              ? "Public Safety"
              : name === "Comms"
                ? "Comms Network"
                : name;
      const matchingDepartment = departments.find((department) => department.name === mappedName) || departments[0];
      const statusValue = matchingDepartment?.status || "Active Sync";
      return {
        id: name,
        name,
        category: name,
        health: departmentHealth[name],
        status: statusValue,
        openIncidents: count,
        completedIncidents: 0,
        count
      };
    });

    const kpis = [
      {
        label: "Total Incidents",
        value: incidents.length.toString(),
        unit: "tickets",
        status: "normal",
        change: `${resolvedIncidents} resolved`
      },
      {
        label: "Critical Incidents",
        value: criticalIncidents.toString(),
        unit: "alerts",
        status: criticalIncidents > 0 ? "critical" : "normal",
        change: `${highPriorityIncidents} high priority`
      },
      {
        label: "Open Incidents",
        value: openIncidents.toString(),
        unit: "active",
        status: openIncidents > 0 ? "warning" : "normal",
        change: `${repairingIncidents} repairing`
      }
    ];

    let aiSummary = "CivicIntel AI Telemetry Grounding: Municipal systems optimal.";
    try {
      const queryResult = await GeminiService.queryAI("Summarize active infrastructure telemetry, list the active tickets, and explain critical risks.", []);
      aiSummary = queryResult.answer;
    } catch (err) {
      console.warn("AI summary generation failed, using cached summary:", err);
    }

    const riskIndex = Math.min(0.45, Math.max(0.05, (criticalIncidents * 0.08) + (highPriorityIncidents * 0.03) + (openIncidents * 0.01)));

    return {
      infrastructureHealth,
      activeIncidentsCount: activeIncidentsList.length,
      criticalAlerts,
      departments: departmentCards,
      kpis,
      charts: dailyTrend,
      recentIncidents: incidents.slice(-5),
      aiSummary,
      notifications,
      stats: {
        totalIncidents: incidents.length,
        criticalIncidents,
        highPriorityIncidents,
        repairingIncidents,
        resolvedIncidents,
        openIncidents
      },
      riskIndex,
      severityCounts,
      departmentSummary
    };
  }
}
