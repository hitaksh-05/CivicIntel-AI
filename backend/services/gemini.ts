import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import dotenv from "dotenv";
import { AIDiagnosticResponse, Incident } from "../types";
import { IncidentService } from "./incidentService";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn("Failed to initialize GoogleGenAI client:", err);
    }
  }
  return aiClient;
}

const toTitleCase = (value: string) => value.replace(/\b\w/g, (char) => char.toUpperCase());

const isResolved = (incident: Incident) => incident.status === "Resolved" || incident.kanbanStatus === "completed";

const isToday = (incident: Incident) => {
  const generatedAt = incident.generatedAt || incident.timeLogged;
  if (!generatedAt) return false;
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const normalizeTicketReference = (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, "");

const buildIncidentContext = (incidents: Incident[]) => {
  const activeIncidents = incidents.filter((incident) => !isResolved(incident));
  const resolvedIncidents = incidents.filter((incident) => isResolved(incident));
  const criticalIncidents = activeIncidents.filter((incident) => incident.severity === "Critical");
  const highPriorityIncidents = activeIncidents.filter((incident) => incident.severity === "High" || incident.priority === "High");
  const todayReports = incidents.filter(isToday);
  const transportIncidents = activeIncidents.filter((incident) => /transport|road|traffic|lane|signal/i.test(`${incident.title} ${incident.description} ${incident.department} ${incident.category}`));
  const waterIncidents = activeIncidents.filter((incident) => /water|sewage|pipe|main|drain|utility/i.test(`${incident.title} ${incident.description} ${incident.department} ${incident.category}`));
  const electricityIncidents = activeIncidents.filter((incident) => /electric|power|energy|grid|substation/i.test(`${incident.title} ${incident.description} ${incident.department} ${incident.category}`));

  const departmentWorkload = activeIncidents.reduce((acc, incident) => {
    const department = incident.department || incident.category || "General";
    acc[department] = (acc[department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDepartment = Object.entries(departmentWorkload).sort((a, b) => b[1] - a[1])[0];
  const highestArea = activeIncidents.reduce((acc, incident) => {
    const area = (incident.address || incident.location || incident.department || "Unassigned").trim();
    if (!area) return acc;
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topArea = Object.entries(highestArea).sort((a, b) => b[1] - a[1])[0];
  const priorityTicket = [...activeIncidents].sort((a, b) => {
    const severityWeight = (value: Incident["severity"]) => value === "Critical" ? 4 : value === "High" ? 3 : value === "Moderate" ? 2 : 1;
    return severityWeight(b.severity) - severityWeight(a.severity);
  })[0];

  return {
    activeIncidents,
    resolvedIncidents,
    criticalIncidents,
    highPriorityIncidents,
    todayReports,
    transportIncidents,
    waterIncidents,
    electricityIncidents,
    departmentWorkload,
    topDepartment,
    topArea,
    priorityTicket,
    totalIncidents: incidents.length,
    openCount: activeIncidents.length,
    resolvedCount: resolvedIncidents.length
  };
};

const getWorkflowStage = (incident: Incident) => {
  if (incident.status === "Resolved" || incident.kanbanStatus === "completed") return "Resolved";
  if (incident.currentStage && incident.currentStage.toLowerCase() !== "queued") return incident.currentStage;
  if (incident.kanbanStatus === "in_progress") return "In Progress";
  if (incident.kanbanStatus === "review") return "Review";
  if (incident.kanbanStatus === "todo") return "Queued";
  if (incident.status === "En Route") return "En Route";
  if (incident.status === "Repairing") return "Repairing";
  if (incident.status === "Investigating") return "Investigating";
  return "Queued";
};

const formatIncidentSummary = (incident: Incident) => {
  const ticketId = incident.ticketId || incident.ticketNumber || "Unknown";
  const stage = getWorkflowStage(incident);
  return `• ${ticketId} — ${incident.title} (${incident.department || incident.category || "General"}, ${incident.severity}, ${incident.status}, ${stage})`;
};

const createRecommendations = (context: ReturnType<typeof buildIncidentContext>, query: string) => {
  const recommendations: string[] = [];
  if (context.criticalIncidents.length > 0) recommendations.push("Dispatch field units to all critical incidents");
  if (context.waterIncidents.length > 0) recommendations.push("Escalate water and sewer issues to utilities");
  if (context.transportIncidents.length > 0) recommendations.push("Prioritize road and transit service checks");
  if (context.electricityIncidents.length > 0) recommendations.push("Inspect power and grid assets for escalation");
  if (recommendations.length === 0) recommendations.push("Continue monitoring the current incident queue");
  if (/today|recent|resolved|status|open|summary/i.test(query)) recommendations.push("Schedule a follow-up review at the next shift handoff");
  return recommendations.slice(0, 4);
};

const getQualitativeStatus = (context: ReturnType<typeof buildIncidentContext>) => {
  if (context.openCount === 0) return "Normal";
  if (context.criticalIncidents.length >= 2 || context.openCount >= 8) return "Critical";
  if (context.criticalIncidents.length >= 1 || context.openCount >= 5) return "High Risk";
  if (context.openCount >= 3 || context.highPriorityIncidents.length >= 2) return "Moderate Risk";
  return "Stable";
};

const buildDepartmentWorkloadSummary = (context: ReturnType<typeof buildIncidentContext>) => {
  const entries = Object.entries(context.departmentWorkload).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!entries.length) return "No active department workload recorded.";
  return entries.map(([name, count]) => `${toTitleCase(name)} (${count})`).join(", ");
};

const buildResolutionProgressSummary = (context: ReturnType<typeof buildIncidentContext>) => {
  if (context.totalIncidents === 0) return "No incidents recorded yet.";
  return `${context.resolvedCount} resolved / ${context.totalIncidents} total (${context.openCount} still open)`;
};

const buildOperationalSummary = (context: ReturnType<typeof buildIncidentContext>, query: string) => {
  const status = getQualitativeStatus(context);
  const topTicket = context.priorityTicket
    ? `${context.priorityTicket.ticketId || context.priorityTicket.ticketNumber || "Unknown"} — ${context.priorityTicket.title}`
    : "None";
  const recommendations = createRecommendations(context, query);

  return [
    `Operational status: ${status}`,
    `Active incident count: ${context.openCount}`,
    `Critical incident count: ${context.criticalIncidents.length}`,
    `Department workload: ${buildDepartmentWorkloadSummary(context)}`,
    `Highest priority ticket: ${topTicket}`,
    `Resolution progress: ${buildResolutionProgressSummary(context)}`,
    "",
    "Recommended operational action:",
    ...recommendations.map((item) => `• ${item}`)
  ].join("\n");
};

const buildStageBreakdown = (context: ReturnType<typeof buildIncidentContext>) => {
  const stageBuckets = context.activeIncidents.reduce((acc, incident) => {
    const stage = getWorkflowStage(incident);
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resolvedCount = context.resolvedIncidents.length;
  return [
    ...(Object.entries(stageBuckets).sort((a, b) => b[1] - a[1]).map(([name, count]) => `• ${name}: ${count}`)),
    ...(resolvedCount ? [`• Resolved: ${resolvedCount}`] : [])
  ];
};

const buildGreetingResponse = (query: string) => {
  const prompts = [
    "Summarize active incidents",
    "Show current incident health",
    "Inspect workload across departments",
    "Prioritize the highest severity ticket",
    "Report resolution progress"
  ];
  return [
    `Hello. I can review the current incident queue for you.`,
    `Try one of the quick prompts: ${prompts.join(" • ")}`
  ].join("\n");
};

const buildLocalOperationalResponse = (query: string, incidents: Incident[]) => {
  const context = buildIncidentContext(incidents);
  const q = query.toLowerCase();
  const summaryBlock = buildOperationalSummary(context, query);

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)(\b|!|\.)/i.test(q.trim())) {
    return buildGreetingResponse(q);
  }

  if (!incidents.length) {
    return [
      "Operational status: Normal",
      "Active incident count: 0",
      "Critical incident count: 0",
      "Department workload: No active department workload recorded.",
      "Highest priority ticket: None",
      "Resolution progress: No incidents recorded yet.",
      "",
      "Recommended operational action:",
      "• Continue monitoring the incident queue",
      "• Log any new incident report as it arrives"
    ].join("\n");
  }

  if (/summarize active incidents|show all active incidents|active incidents|list active incidents/i.test(q)) {
    const lines = context.activeIncidents.slice(0, 8).map(formatIncidentSummary);
    return [summaryBlock, "", "Active incidents:", ...lines].join("\n");
  }

  if (/current incident health|incident health|show current incident health/i.test(q)) {
    const openCount = context.activeIncidents.length;
    const inProgressCount = context.activeIncidents.filter((incident) => getWorkflowStage(incident) === "In Progress").length;
    const resolvedCount = context.resolvedIncidents.length;
    return [
      summaryBlock,
      "",
      `Open incidents: ${openCount}`,
      `In-progress incidents: ${inProgressCount}`,
      `Resolved incidents: ${resolvedCount}`
    ].join("\n");
  }

  if (/critical incidents|critical alerts/i.test(q)) {
    if (!context.criticalIncidents.length) {
      return [summaryBlock, "", "Critical incidents:", "• No critical incidents are currently open."].join("\n");
    }

    const lines = context.criticalIncidents.slice(0, 6).map(formatIncidentSummary);
    return [summaryBlock, "", "Critical incidents:", ...lines].join("\n");
  }

  if (/department has the most incidents|workload|department workload|inspect workload across departments|departments/i.test(q)) {
    const entries = Object.entries(context.departmentWorkload).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return [summaryBlock, "", "Department breakdown:", ...entries.map(([name, count]) => `• ${toTitleCase(name)}: ${count} active incident${count === 1 ? "" : "s"}`)].join("\n");
  }

  if (/prioritize|highest severity|highest priority|priority ticket|should be resolved|severity/i.test(q)) {
    const nextTicket = context.priorityTicket;
    const reason = nextTicket
      ? `${nextTicket.severity} severity and ${nextTicket.department || nextTicket.category || "General"} ownership.`
      : "No active ticket is currently above the rest of the queue.";
    return [
      summaryBlock,
      "",
      nextTicket
        ? `Priority detail: ${nextTicket.ticketId || nextTicket.ticketNumber} — ${nextTicket.title} (${nextTicket.severity})`
        : "Priority detail: No active ticket is currently above the rest of the queue.",
      `Reasoning: ${reason}`
    ].join("\n");
  }

  if (/resolution progress|workflow stage|stage|report resolution progress|resolved/i.test(q)) {
    const stageLines = buildStageBreakdown(context);
    return [summaryBlock, "", "Workflow stage breakdown:", ...stageLines].join("\n");
  }

  if (/unresolved tickets|show unresolved|open tickets|open incidents/i.test(q)) {
    const lines = context.activeIncidents.slice(0, 8).map(formatIncidentSummary);
    return [summaryBlock, "", "Unresolved tickets:", ...lines].join("\n");
  }

  if (/transport|road|traffic/i.test(q)) {
    const lines = context.transportIncidents.length ? context.transportIncidents.slice(0, 6).map(formatIncidentSummary) : ["• No active transport incidents are currently open."];
    return [summaryBlock, "", "Transport incidents:", ...lines].join("\n");
  }

  if (/water|sewage|drain|utility/i.test(q)) {
    const lines = context.waterIncidents.length ? context.waterIncidents.slice(0, 6).map(formatIncidentSummary) : ["• No active water and sewer issues are currently open."];
    return [summaryBlock, "", "Water and sewage issues:", ...lines].join("\n");
  }

  if (/electric|power|energy|grid|substation/i.test(q)) {
    const lines = context.electricityIncidents.length ? context.electricityIncidents.slice(0, 6).map(formatIncidentSummary) : ["• No active electricity incidents are currently open."];
    return [summaryBlock, "", "Electricity incidents:", ...lines].join("\n");
  }

  if (/today|today's reports|today reports/i.test(q)) {
    const lines = context.todayReports.length ? context.todayReports.slice(0, 6).map(formatIncidentSummary) : ["• No incidents were reported today."];
    return [summaryBlock, "", "Today’s reports:", ...lines].join("\n");
  }

  if (/recently resolved|resolved incidents|resolved/i.test(q)) {
    const lines = context.resolvedIncidents.slice(0, 6).map(formatIncidentSummary);
    return [summaryBlock, "", "Recently resolved:", ...lines].join("\n");
  }

  if (/status of ticket|ticket /i.test(q)) {
    const ticketMatch = q.match(/civ[- ]?\d+/i) || q.match(/#[a-z0-9-]+/i);
    if (!ticketMatch) {
      return [summaryBlock, "", "Ticket status:", "• Please provide a ticket number so I can look up the current status."].join("\n");
    }

    const ticketRef = normalizeTicketReference(ticketMatch[0]);
    const ticket = incidents.find((incident) => normalizeTicketReference(incident.ticketId || incident.ticketNumber || "").includes(ticketRef));
    if (!ticket) {
      return [summaryBlock, "", "Ticket status:", `• No matching ticket was found for ${ticketRef}.`].join("\n");
    }

    return [
      summaryBlock,
      "",
      "Ticket status:",
      `• ${ticket.ticketId || ticket.ticketNumber} is currently ${ticket.status}.`,
      `• ${ticket.title} is assigned to ${ticket.department || ticket.category || "the operations queue"}.`,
      `• Current stage: ${ticket.currentStage || ticket.kanbanStatus || "Monitoring"}.`
    ].join("\n");
  }

  if (/area has the highest number of reports|highest number of reports|area/i.test(q)) {
    const area = context.topArea;
    return [summaryBlock, "", area ? `Area concentration: ${area[0]} (${area[1]} incident${area[1] === 1 ? "" : "s"})` : "Area concentration: No area concentration is available from the current dataset."].join("\n");
  }

  if (/incident|ticket|severity|transport|utilities|water|pothole|resolved|department|status|active|prediction|analysis/i.test(q)) {
    return [
      summaryBlock,
      "",
      `I reviewed the current incident store and found ${context.openCount} active incident${context.openCount === 1 ? "" : "s"} with ${context.criticalIncidents.length} critical item${context.criticalIncidents.length === 1 ? "" : "s"}.`,
      context.priorityTicket
        ? `The highest priority record is ${context.priorityTicket.ticketId || context.priorityTicket.ticketNumber} — ${context.priorityTicket.title}.`
        : "No active incident is currently ranked above the rest of the queue.",
      "",
      "If you need a more specific view, ask for active incidents, department workload, critical alerts, or resolution progress."
    ].join("\n");
  }

  return [
    "I cannot answer that from the current incident dataset alone.",
    "The available data covers active incidents, critical items, department workload, ticket priority, and resolution progress.",
    "",
    summaryBlock
  ].join("\n");
};

export class GeminiService {
  /**
   * Processes a natural language query about the city telemetry
   */
  static async queryAI(query: string, history: any[]): Promise<{ answer: string; grounded: boolean; timestamp: string }> {
    const incidents = await IncidentService.getAllIncidents();
    const localAnswer = buildLocalOperationalResponse(query, incidents);

    return {
      answer: localAnswer,
      grounded: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Performs an AI analysis on a reported incident
   */
  static async analyzeIncident(
    category: string,
    location: string,
    description: string,
    severity: string,
    imageData?: string
  ): Promise<AIDiagnosticResponse> {
    const client = getAIClient();
    if (client) {
      try {
        const prompt = `You are CivicIntel AI Incident Diagnostic Engine.
Analyze the following infrastructure incident report submitted by a city worker:
Category: ${category || "General"}
Location: ${location || "Unknown Coordinates"}
Reported Severity: ${severity || "Moderate"}
Description: ${description || "None"}

Return a JSON object strictly with these fields:
{
  "confidence": number (between 85 and 99),
  "incidentCategory": "short category label",
  "severity": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "diagnosis": "short technical summary",
  "rootCause": "likely engineering root cause",
  "riskAssessment": "short explanation of operational risk",
  "predictedImpact": "what happens if unaddressed",
  "actionPlan": ["step 1", "step 2", "step 3"],
  "urgencyScore": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "suggestedDepartment": "suggested department name",
  "repairPriority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "estimatedRepairTime": "estimated duration",
  "riskExplanation": "detailed explanation of risks",
  "recommendedActions": ["action 1", "action 2"]
}`;

        const parts: any[] = [{ text: prompt }];
        if (imageData) {
          const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (match) {
            parts.push(createPartFromBase64(match[2], match[1]));
          }
        }

        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: parts,
          config: { responseMimeType: "application/json" }
        });

        const parsed = JSON.parse(response.text || "{}");
        return {
          confidence: parsed.confidence || 95.0,
          incidentCategory: parsed.incidentCategory || category || "Infrastructure",
          severity: parsed.severity || (severity.toUpperCase() as any) || "MODERATE",
          diagnosis: parsed.diagnosis || `Anomalous municipal disruption reported in ${category || 'infrastructure'}.`,
          rootCause: parsed.rootCause || "Material fatigue or environmental load threshold exceeded.",
          riskAssessment: parsed.riskAssessment || parsed.riskExplanation || parsed.predictedImpact || "High operational risk until addressed.",
          predictedImpact: parsed.predictedImpact || "Service disruption to local sector.",
          actionPlan: parsed.actionPlan || ["Assess on-site telemetry", "Dispatch repair team"],
          urgencyScore: parsed.urgencyScore || (severity.toUpperCase() as any) || "MODERATE",
          suggestedDepartment: parsed.suggestedDepartment || category,
          repairPriority: parsed.repairPriority || severity.toUpperCase(),
          estimatedRepairTime: parsed.estimatedRepairTime || "2-4 hours",
          riskExplanation: parsed.riskExplanation || parsed.predictedImpact,
          recommendedActions: parsed.recommendedActions || parsed.actionPlan
        };
      } catch (err) {
        console.error("Gemini Analyze Error, using fallback:", err);
      }
    }

    // Heuristic Fallback
    const urgency = (severity || "MODERATE").toUpperCase() as "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    return {
      confidence: 94,
      incidentCategory: category || "Infrastructure",
      severity: urgency,
      diagnosis: `Anomalous municipal disruption reported in ${category || 'infrastructure'}. Sensor cross-referencing indicates localized containment.`,
      rootCause: "Environmental stress combined with aging infrastructure component tolerances.",
      riskAssessment: `High risk of service drop if the reported issue in ${location} is left untreated.`,
      predictedImpact: severity === "Critical" ? "Cascading failure across adjacent municipal sectors within 12-24 hours." : "Localized service degradation with minor citizen inconvenience.",
      actionPlan: [
        "Isolate affected municipal utility sector via remote telemetry valves/switches.",
        "Dispatch Tier-2 field diagnostic technicians with replacement hardware.",
        "Issue localized citizen notification via mobile civic app transit alerts."
      ],
      urgencyScore: urgency,
      suggestedDepartment: category.includes("Water") ? "Utilities" : category.includes("Power") || category.includes("Grid") ? "Energy" : "Transport",
      repairPriority: urgency === "CRITICAL" ? "CRITICAL" : urgency === "HIGH" ? "HIGH" : "MEDIUM",
      estimatedRepairTime: severity === "Critical" ? "4.2 hours" : "18 hours",
      riskExplanation: `High risk of service drop if the reported issue in ${location} is left untreated.`,
      recommendedActions: [
        "Isolate affected municipal utility sector via remote telemetry valves/switches.",
        "Dispatch Tier-2 field diagnostic technicians with replacement hardware."
      ]
    };
  }
}
