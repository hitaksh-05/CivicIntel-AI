export type NavTab = 
  | "landing"
  | "dashboard"
  | "map"
  | "analysis"
  | "report"
  | "command"
  | "insights"
  | "tracker";

export interface SubsystemStatus {
  id: string;
  name: string;
  health: number; // percentage
  status: "Optimal" | "Active Sync" | "Action Required" | "In Compliance" | "Critical";
  category: "Energy" | "Water" | "Transit" | "Comms" | "Safety";
}

export interface LiveKPI {
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  change: string;
}

export interface IncidentMarker {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  coords: [number, number]; // map percentage [x, y]
  latitude?: number;
  longitude?: number;
  address?: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  status: "Investigating" | "En Route" | "Repairing" | "Resolved";
  pressureLoss?: string;
  affectedUnits?: string;
  unitEnRoute?: string;
  description: string;
}

export interface KanbanTicket {
  id: string;
  ticketNumber: string;
  title: string;
  department: string;
  priority: "Low" | "Moderate" | "High" | "Critical";
  status: "todo" | "in_progress" | "review" | "completed";
  timeLogged: string;
  assignee: string;
}

export interface MaintenanceItem {
  id: string;
  assetName: string;
  code: string;
  timeRemaining: string; // e.g. "-4h"
  urgency: "urgent" | "normal" | "critical";
}

export interface CopilotMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  grounded?: boolean;
}
