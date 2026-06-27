import { Incident } from "../types";
import { readJSON, writeJSON } from "../utils/jsonHelper";
import { normalizeIncidentData } from "../utils/incidentLifecycle";

export class IncidentService {
  private static FILE_NAME = "incidents.json";

  static async getAllIncidents(): Promise<Incident[]> {
    return await readJSON<Incident[]>(this.FILE_NAME);
  }

  static async getIncidentById(id: string): Promise<Incident | null> {
    const incidents = await this.getAllIncidents();
    return incidents.find(i => i.id === id) || null;
  }

  static async createIncident(data: Partial<Incident>): Promise<Incident> {
    const incidents = await this.getAllIncidents();

    const normalized = normalizeIncidentData({
      department: data.department,
      category: data.category,
      severity: data.severity,
      priority: data.priority,
      status: data.status,
      kanbanStatus: data.kanbanStatus,
      lifecycleStage: data.currentStage,
      currentStage: data.currentStage,
      progress: data.progress,
      completionPercent: data.completionPercent
    });

    const reportKey = data.reportKey || `${(data.title || "incident").toLowerCase()}::${(data.location || data.address || "unknown").toLowerCase()}::${(data.description || "").toLowerCase()}`;
    const existingIncident = incidents.find((incident) => incident.reportKey === reportKey);
    if (existingIncident) {
      const updatedIncident = {
        ...existingIncident,
        title: data.title || existingIncident.title,
        category: data.category || existingIncident.category,
        department: normalized.department || existingIncident.department,
        severity: (data.severity as Incident["severity"]) || existingIncident.severity,
        priority: (data.priority as Incident["priority"]) || existingIncident.priority || (data.severity as Incident["severity"]) || existingIncident.severity,
        status: normalized.status || existingIncident.status,
        description: data.description || existingIncident.description,
        location: data.location || existingIncident.location,
        address: data.address || existingIncident.address,
        latitude: data.latitude ?? existingIncident.latitude,
        longitude: data.longitude ?? existingIncident.longitude,
        imageData: data.imageData || data.imagePath || existingIncident.imageData || existingIncident.imagePath,
        imagePath: data.imagePath || data.imageData || existingIncident.imagePath || existingIncident.imageData,
        aiFindings: data.aiFindings || existingIncident.aiFindings,
        generatedAt: data.generatedAt || existingIncident.generatedAt || new Date().toISOString(),
        reportKey,
        timeLogged: existingIncident.timeLogged,
        aiScore: data.aiScore ?? existingIncident.aiScore,
        progress: normalized.progress || existingIncident.progress,
        completionPercent: normalized.completionPercent ?? existingIncident.completionPercent,
        currentStage: normalized.currentStage || existingIncident.currentStage,
        coords: data.coords || existingIncident.coords,
        kanbanStatus: normalized.kanbanStatus || existingIncident.kanbanStatus
      } as Incident;
      const idx = incidents.findIndex((incident) => incident.id === existingIncident.id);
      incidents[idx] = updatedIncident;
      await writeJSON(this.FILE_NAME, incidents);
      return updatedIncident;
    }
    
    // Generate unique ID and ticket numbers
    const newId = "inc_" + Math.random().toString(36).substring(2, 9);
    const randomTicketNum = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `#CIV-${randomTicketNum}`;

    const avatars = [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8O7yBXOtDhUZDmKrlbpy_JkPFSOsYw8ojBVxdU1eUdf8Mv0Eeyy3P2TYqowcIkis0mDV1TXrZrYCIS_O-5Th78qV2gZiAtYffeklGtQGfEwQqbmPQPgy7xFj4-p1H1uwASadbmOQiBkrl0PHRRPhZFwCib0CFcVWQdrKH0xzUXFJn1Y33pw7qIlfQPdUyoxT2xs2kNCjswLgxvdk_MP7sWNfy5VHpdA4Mi9-8MVKR7Y4lyYPrWjT0A936cWfWnzvE2J6qIRSEF4A",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtMNWHiTL7whJAZVH3fDtieWVG-xnQ-VSfLLNDiRQ59SFFiVVQp7zRGfoc_7aQYZZCT_yQggSJMomRV3oG36YqzvDQOed1XDsiHGyo0Yb73NeOJNMlLijkNN8jQM3eK8brTG45sznwiIQzhGnWi0Yh2HNQ3BJ693uB7g_YFQxcqhhZppO8qwiTZz19J0YlRkNTrtY1FtRUup642vEEu3nrwm3wgQveYajxwDNzZELMjIwjEdeJOS-jESGPAVfw9OvKO6ENI4ZGsHo"
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const severityVal = normalized.severity;
    const categoryVal = data.category || "General";
    const departmentVal = normalized.department;

    const newIncident: Incident = {
      id: newId,
      ticketId,
      ticketNumber: ticketId,
      title: data.title || "Reported Disruption",
      category: categoryVal,
      department: departmentVal,
      coords: data.coords || [20 + Math.random() * 60, 20 + Math.random() * 60],
      latitude: data.latitude ?? 37.7749 + (Math.random() - 0.5) * 0.05,
      longitude: data.longitude ?? -122.4194 + (Math.random() - 0.5) * 0.05,
      address: data.address || data.location || undefined,
      location: data.location || data.address || undefined,
      severity: severityVal,
      priority: normalized.priority,
      status: normalized.status,
      kanbanStatus: normalized.kanbanStatus,
      description: data.description || "No description provided.",
      assignee: randomAvatar,
      timeLogged: "Just now",
      aiScore: data.aiScore || 50.0,
      progress: normalized.progress,
      completionPercent: normalized.completionPercent,
      currentStage: normalized.currentStage,
      affectedUnits: data.affectedUnits || undefined,
      pressureLoss: data.pressureLoss || undefined,
      unitEnRoute: data.unitEnRoute || undefined,
      imageData: data.imageData || data.imagePath || undefined,
      imagePath: data.imagePath || data.imageData || undefined,
      aiFindings: data.aiFindings || undefined,
      generatedAt: data.generatedAt || new Date().toISOString(),
      reportKey
    };

    incidents.push(newIncident);
    await writeJSON(this.FILE_NAME, incidents);
    return newIncident;
  }

  static async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const incidents = await this.getAllIncidents();
    const idx = incidents.findIndex(i => i.id === id);
    if (idx === -1) return null;

    const normalized = normalizeIncidentData({
      department: updates.department,
      category: updates.category,
      severity: updates.severity,
      priority: updates.priority,
      status: updates.status,
      kanbanStatus: updates.kanbanStatus,
      lifecycleStage: updates.currentStage,
      currentStage: updates.currentStage,
      progress: updates.progress,
      completionPercent: updates.completionPercent
    });

    const updated = {
      ...incidents[idx],
      ...updates,
      department: normalized.department || updates.department || incidents[idx].department,
      severity: updates.severity ? normalized.severity : incidents[idx].severity,
      priority: updates.priority ? normalized.priority : updates.severity ? normalized.priority : incidents[idx].priority,
      status: updates.status ? normalized.status : incidents[idx].status,
      kanbanStatus: updates.kanbanStatus ? normalized.kanbanStatus : updates.status ? normalized.kanbanStatus : incidents[idx].kanbanStatus,
      progress: updates.progress ? normalized.progress : incidents[idx].progress,
      completionPercent: updates.completionPercent !== undefined ? normalized.completionPercent : incidents[idx].completionPercent,
      currentStage: updates.currentStage ? normalized.currentStage : incidents[idx].currentStage
    };
    incidents[idx] = updated;

    await writeJSON(this.FILE_NAME, incidents);
    return updated;
  }

  static async updateIncidentStatus(id: string, status: Incident["status"] | Incident["kanbanStatus"]): Promise<Incident | null> {
    const incidents = await this.getAllIncidents();
    const idx = incidents.findIndex(i => i.id === id);
    if (idx === -1) return null;

    const incident = incidents[idx];
    const normalized = normalizeIncidentData({ status, kanbanStatus: ["todo", "in_progress", "review", "completed"].includes(status as string) ? status as string : undefined });

    if (["todo", "in_progress", "review", "completed"].includes(status as string)) {
      incident.kanbanStatus = normalized.kanbanStatus as Incident["kanbanStatus"];
      incident.status = normalized.status;
      incident.progress = normalized.progress;
      incident.currentStage = normalized.currentStage;
      incident.completionPercent = normalized.completionPercent;
    } else {
      incident.status = normalized.status;
      incident.kanbanStatus = normalized.kanbanStatus as Incident["kanbanStatus"];
      incident.progress = normalized.progress;
      incident.currentStage = normalized.currentStage;
      incident.completionPercent = normalized.completionPercent;
    }

    incidents[idx] = incident;
    await writeJSON(this.FILE_NAME, incidents);
    return incident;
  }

  static async updateIncidentProgress(
    id: string,
    progressData: { assignee?: string; progress?: string; completionPercent?: number; currentStage?: string }
  ): Promise<Incident | null> {
    const incidents = await this.getAllIncidents();
    const idx = incidents.findIndex(i => i.id === id);
    if (idx === -1) return null;

    const incident = incidents[idx];
    if (progressData.assignee !== undefined) incident.assignee = progressData.assignee;
    if (progressData.progress !== undefined) incident.progress = progressData.progress;
    if (progressData.completionPercent !== undefined) incident.completionPercent = progressData.completionPercent;
    if (progressData.currentStage !== undefined) incident.currentStage = progressData.currentStage;

    incidents[idx] = incident;
    await writeJSON(this.FILE_NAME, incidents);
    return incident;
  }

  static async deleteIncident(id: string): Promise<boolean> {
    const incidents = await this.getAllIncidents();
    const filtered = incidents.filter(i => i.id !== id);
    if (filtered.length === incidents.length) return false;

    await writeJSON(this.FILE_NAME, filtered);
    return true;
  }
}
