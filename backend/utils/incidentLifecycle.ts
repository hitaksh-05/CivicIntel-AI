export type IncidentDepartment = "Water & Sewage" | "Electricity & Power" | "Roads & Transit" | "Structural & Bridges" | "Public Safety" | "General";
export type IncidentSeverity = "Low" | "Moderate" | "High" | "Critical";
export type IncidentStatus = "Investigating" | "En Route" | "Repairing" | "Resolved";
export type IncidentLifecycleStage = "Reported" | "AI Analysis" | "Queued" | "Dispatched" | "En Route" | "Repair In Progress" | "Resolved" | "Closed";
export type IncidentKanbanStatus = "todo" | "in_progress" | "review" | "completed";

const DEPARTMENT_MAP: Record<string, IncidentDepartment> = {
  "water & sewage": "Water & Sewage",
  "water": "Water & Sewage",
  "utilities": "Water & Sewage",
  "electricity & power": "Electricity & Power",
  "electricity": "Electricity & Power",
  "power": "Electricity & Power",
  "energy": "Electricity & Power",
  "roads & transit": "Roads & Transit",
  "roads": "Roads & Transit",
  "road": "Roads & Transit",
  "transit": "Roads & Transit",
  "transport": "Roads & Transit",
  "structural & bridges": "Structural & Bridges",
  "structural": "Structural & Bridges",
  "bridge": "Structural & Bridges",
  "public safety": "Public Safety",
  "safety": "Public Safety",
  "general": "General"
};

const SEVERITY_MAP: Record<string, IncidentSeverity> = {
  low: "Low",
  moderate: "Moderate",
  medium: "Moderate",
  high: "High",
  critical: "Critical",
  urgent: "Critical"
};

const PRIORITY_MAP: Record<string, IncidentSeverity> = {
  low: "Low",
  moderate: "Moderate",
  medium: "Moderate",
  high: "High",
  critical: "Critical",
  urgent: "Critical"
};

export const normalizeDepartment = (value?: string): IncidentDepartment => {
  if (!value) return "General";
  const normalized = value.trim().toLowerCase();
  if (DEPARTMENT_MAP[normalized]) return DEPARTMENT_MAP[normalized];

  if (/water|leak|pipe|sewage|drain|main/i.test(normalized)) return "Water & Sewage";
  if (/power|electric|grid|substation|energy|line|outage/i.test(normalized)) return "Electricity & Power";
  if (/road|traffic|lane|signal|transit|bridge|street|pavement/i.test(normalized)) return "Roads & Transit";
  if (/struct|bridge|overpass|weld|support|pylon/i.test(normalized)) return "Structural & Bridges";
  if (/safety|public|police|fire|hazard/i.test(normalized)) return "Public Safety";

  return DEPARTMENT_MAP[normalized] || (value as IncidentDepartment);
};

export const normalizeSeverity = (value?: string): IncidentSeverity => {
  if (!value) return "Moderate";
  const normalized = value.trim().toLowerCase();
  return SEVERITY_MAP[normalized] || (value as IncidentSeverity);
};

export const normalizePriority = (value?: string): IncidentSeverity => {
  if (!value) return "Moderate";
  const normalized = value.trim().toLowerCase();
  return PRIORITY_MAP[normalized] || (value as IncidentSeverity);
};

const lifecycleToStatus = (stage?: string): IncidentStatus => {
  const normalized = (stage || "").trim().toLowerCase();
  if (["en route", "dispatched"].includes(normalized)) return "En Route";
  if (["repair in progress", "repairing", "in progress", "ai analysis", "ai containment review", "containment review"].includes(normalized)) return "Repairing";
  if (["resolved", "closed"].includes(normalized)) return "Resolved";
  return "Investigating";
};

export const normalizeLifecycleStage = (value?: string, fallbackStatus?: string): IncidentLifecycleStage => {
  const normalized = (value || fallbackStatus || "").trim().toLowerCase();
  if (["reported"].includes(normalized)) return "Reported";
  if (["ai analysis", "ai containment review", "containment review", "review", "analysis", "ai"].includes(normalized)) return "AI Analysis";
  if (["queued", "triage", "todo", "investigating"].includes(normalized)) return "Queued";
  if (["dispatched", "assigned", "dispatch", "field units dispatched", "in_progress", "in progress"].includes(normalized)) return "Dispatched";
  if (["en route"].includes(normalized)) return "En Route";
  if (["repair in progress", "repairing", "in progress"].includes(normalized)) return "Repair In Progress";
  if (["resolved", "closed", "completed"].includes(normalized)) return "Resolved";
  return "Queued";
};

export const normalizeKanbanStatus = (state?: string, fallbackStatus?: string): IncidentKanbanStatus => {
  const normalized = (state || fallbackStatus || "").trim().toLowerCase();
  if (["todo", "triage", "queued", "reported", "investigating"].includes(normalized)) return "todo";
  if (["in_progress", "in progress", "dispatched", "field units dispatched", "en route", "dispatch"].includes(normalized)) return "in_progress";
  if (["review", "reviewing", "ai analysis", "ai containment review", "containment review", "analysis"].includes(normalized)) return "review";
  if (["completed", "resolved", "closed"].includes(normalized)) return "completed";
  return "todo";
};

export interface NormalizedIncidentData {
  department: IncidentDepartment;
  severity: IncidentSeverity;
  priority: IncidentSeverity;
  status: IncidentStatus;
  kanbanStatus: IncidentKanbanStatus;
  lifecycleStage: IncidentLifecycleStage;
  currentStage: IncidentLifecycleStage;
  progress: string;
  completionPercent: number;
}

export const normalizeIncidentData = (
  data: {
    department?: string;
    category?: string;
    severity?: string;
    priority?: string;
    status?: string;
    kanbanStatus?: string;
    lifecycleStage?: string;
    currentStage?: string;
    progress?: string;
    completionPercent?: number;
  }
): NormalizedIncidentData => {
  const lifecycleStage = normalizeLifecycleStage(data.lifecycleStage || data.currentStage || data.status, data.status);
  const status = lifecycleToStatus(lifecycleStage);
  const progress = data.progress || (lifecycleStage === "Resolved" ? "Resolved" : lifecycleStage);
  const completionPercent = typeof data.completionPercent === "number"
    ? data.completionPercent
    : lifecycleStage === "Resolved" ? 100 : lifecycleStage === "Repair In Progress" || lifecycleStage === "En Route" ? 45 : lifecycleStage === "AI Analysis" ? 20 : lifecycleStage === "Queued" ? 5 : 10;

  return {
    department: normalizeDepartment(data.department || data.category),
    severity: normalizeSeverity(data.severity),
    priority: normalizePriority(data.priority || data.severity),
    status,
    kanbanStatus: normalizeKanbanStatus(data.kanbanStatus || lifecycleStage, status),
    lifecycleStage,
    currentStage: lifecycleStage,
    progress,
    completionPercent
  };
};
