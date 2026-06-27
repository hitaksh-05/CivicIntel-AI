export interface SubsystemStatus {
  id: string;
  name: string;
  health: number;
  status: "Optimal" | "Active Sync" | "Action Required" | "In Compliance" | "Critical";
  category: "Energy" | "Water" | "Transit" | "Comms" | "Safety";
  openIncidents?: number;
  completedIncidents?: number;
  avgRepairTime?: string;
  workload?: "Low" | "Moderate" | "High";
  performance?: number;
}

export interface LiveKPI {
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  change: string;
}

export interface Incident {
  id: string;
  ticketId: string;
  ticketNumber: string;
  title: string;
  category: string;
  department: string;
  coords: [number, number]; // [x, y] map percentages
  latitude?: number;
  longitude?: number;
  address?: string;
  location?: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  priority: "Low" | "Moderate" | "High" | "Critical";
  status: "Investigating" | "En Route" | "Repairing" | "Resolved";
  kanbanStatus: "todo" | "in_progress" | "review" | "completed";
  description: string;
  pressureLoss?: string;
  affectedUnits?: string;
  unitEnRoute?: string;
  assignee: string;
  timeLogged: string;
  aiScore: number;
  progress?: string;
  completionPercent?: number;
  currentStage?: string;
  imageData?: string;
  imagePath?: string;
  aiFindings?: Record<string, any>;
  generatedAt?: string;
  reportKey?: string;
}

export interface MaintenanceItem {
  id: string;
  assetName: string;
  code: string;
  timeRemaining: string;
  urgency: "urgent" | "normal" | "critical";
}

export interface PredictiveItem {
  sector: string;
  currentLoad: number;
  failureProb: number;
}

export interface SubsystemRadarItem {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

export interface RiskItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  prob: number;
  recommendation: string;
}

export interface PredictData {
  predictiveBarData: PredictiveItem[];
  subsystemRadarData: SubsystemRadarItem[];
  maintenanceRecommendations: MaintenanceItem[];
  risks: RiskItem[];
  budgetEstimations: {
    recommendedMaintenance: number;
    emergencyMitigation: number;
    structuralShoring: number;
  };
}

export interface AIDiagnosticResponse {
  confidence: number;
  incidentCategory?: string;
  severity?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  diagnosis: string;
  rootCause: string;
  riskAssessment?: string;
  predictedImpact: string;
  actionPlan: string[];
  urgencyScore: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  suggestedDepartment?: string;
  repairPriority?: string;
  estimatedRepairTime?: string;
  riskExplanation?: string;
  recommendedActions?: string[];
}
