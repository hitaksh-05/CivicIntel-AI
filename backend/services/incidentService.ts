import { Incident } from "../types";
import { normalizeIncidentData } from "../utils/incidentLifecycle";
import { supabase } from "../supabase";

export class IncidentService {
  static async getAllIncidents(): Promise<Incident[]> {
    const { data, error } = await supabase
      .from("incidents")
      .select("*");

    if (error) throw error;
    return data as Incident[] || [];
  }

  static async getIncidentById(id: string): Promise<Incident | null> {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data as Incident) || null;
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

      const dbIncident = {
        id: updatedIncident.id,
        title: updatedIncident.title,
        category: updatedIncident.category,
        department: updatedIncident.department,
        severity: updatedIncident.severity,
        priority: updatedIncident.priority,
        status: updatedIncident.status,
        description: updatedIncident.description,
        location: updatedIncident.location,
        address: updatedIncident.address,
        latitude: updatedIncident.latitude,
        longitude: updatedIncident.longitude,
        ticketid: updatedIncident.ticketId,
        ticketnumber: updatedIncident.ticketNumber,
        assignee: updatedIncident.assignee,
        kanbanstatus: updatedIncident.kanbanStatus,
        timelogged: updatedIncident.timeLogged,
        aiscore: updatedIncident.aiScore,
        completionpercent: updatedIncident.completionPercent,
        progress: updatedIncident.progress,
        currentstage: updatedIncident.currentStage,
        affectedunits: updatedIncident.affectedUnits,
        pressureloss: updatedIncident.pressureLoss,
        unitenroute: updatedIncident.unitEnRoute,
        imagedata: updatedIncident.imageData,
        imagepath: updatedIncident.imagePath,
        aifindings: updatedIncident.aiFindings,
        generatedat: updatedIncident.generatedAt,
        reportkey: updatedIncident.reportKey
      };

      const { error: updateError } = await supabase
        .from("incidents")
        .update(dbIncident)
        .eq("id", existingIncident.id);

      if (updateError) throw updateError;
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

    const dbIncident = {
      id: newIncident.id,
      title: newIncident.title,
      category: newIncident.category,
      department: newIncident.department,
      severity: newIncident.severity,
      priority: newIncident.priority,
      status: newIncident.status,
      description: newIncident.description,
      location: newIncident.location,
      address: newIncident.address,
      latitude: newIncident.latitude,
      longitude: newIncident.longitude,
      ticketid: newIncident.ticketId,
      ticketnumber: newIncident.ticketNumber,
      assignee: newIncident.assignee,
      kanbanstatus: newIncident.kanbanStatus,
      timelogged: newIncident.timeLogged,
      aiscore: newIncident.aiScore,
      completionpercent: newIncident.completionPercent,
      progress: newIncident.progress,
      currentstage: newIncident.currentStage,
      affectedunits: newIncident.affectedUnits,
      pressureloss: newIncident.pressureLoss,
      unitenroute: newIncident.unitEnRoute,
      imagedata: newIncident.imageData,
      imagepath: newIncident.imagePath,
      aifindings: newIncident.aiFindings,
      generatedat: newIncident.generatedAt,
      reportkey: newIncident.reportKey
    };

    const { error: insertError } = await supabase
      .from("incidents")
      .insert([dbIncident]);

    if (insertError) throw insertError;
    return newIncident;
  }

  static async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const incident = await this.getIncidentById(id);
    if (!incident) return null;

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
      ...incident,
      ...updates,
      department: normalized.department || updates.department || incident.department,
      severity: updates.severity ? normalized.severity : incident.severity,
      priority: updates.priority ? normalized.priority : updates.severity ? normalized.priority : incident.priority,
      status: updates.status ? normalized.status : incident.status,
      kanbanStatus: updates.kanbanStatus ? normalized.kanbanStatus : updates.status ? normalized.kanbanStatus : incident.kanbanStatus,
      progress: updates.progress ? normalized.progress : incident.progress,
      completionPercent: updates.completionPercent !== undefined ? normalized.completionPercent : incident.completionPercent,
      currentStage: updates.currentStage ? normalized.currentStage : incident.currentStage
    };

    const dbIncident = {
      id: updated.id,
      title: updated.title,
      category: updated.category,
      department: updated.department,
      severity: updated.severity,
      priority: updated.priority,
      status: updated.status,
      description: updated.description,
      location: updated.location,
      address: updated.address,
      latitude: updated.latitude,
      longitude: updated.longitude,
      ticketid: updated.ticketId,
      ticketnumber: updated.ticketNumber,
      assignee: updated.assignee,
      kanbanstatus: updated.kanbanStatus,
      timelogged: updated.timeLogged,
      aiscore: updated.aiScore,
      completionpercent: updated.completionPercent,
      progress: updated.progress,
      currentstage: updated.currentStage,
      affectedunits: updated.affectedUnits,
      pressureloss: updated.pressureLoss,
      unitenroute: updated.unitEnRoute,
      imagedata: updated.imageData,
      imagepath: updated.imagePath,
      aifindings: updated.aiFindings,
      generatedat: updated.generatedAt,
      reportkey: updated.reportKey
    };

    const { error } = await supabase
      .from("incidents")
      .update(dbIncident)
      .eq("id", id);

    if (error) throw error;
    return updated;
  }

  static async updateIncidentStatus(id: string, status: Incident["status"] | Incident["kanbanStatus"]): Promise<Incident | null> {
    const incident = await this.getIncidentById(id);
    if (!incident) return null;

    const normalized = normalizeIncidentData({ status, kanbanStatus: ["todo", "in_progress", "review", "completed"].includes(status as string) ? status as string : undefined });

    const updated = { ...incident };

    if (["todo", "in_progress", "review", "completed"].includes(status as string)) {
      updated.kanbanStatus = normalized.kanbanStatus as Incident["kanbanStatus"];
      updated.status = normalized.status;
      updated.progress = normalized.progress;
      updated.currentStage = normalized.currentStage;
      updated.completionPercent = normalized.completionPercent;
    } else {
      updated.status = normalized.status;
      updated.kanbanStatus = normalized.kanbanStatus as Incident["kanbanStatus"];
      updated.progress = normalized.progress;
      updated.currentStage = normalized.currentStage;
      updated.completionPercent = normalized.completionPercent;
    }

    const dbIncident = {
      id: updated.id,
      title: updated.title,
      category: updated.category,
      department: updated.department,
      severity: updated.severity,
      priority: updated.priority,
      status: updated.status,
      description: updated.description,
      location: updated.location,
      address: updated.address,
      latitude: updated.latitude,
      longitude: updated.longitude,
      ticketid: updated.ticketId,
      ticketnumber: updated.ticketNumber,
      assignee: updated.assignee,
      kanbanstatus: updated.kanbanStatus,
      timelogged: updated.timeLogged,
      aiscore: updated.aiScore,
      completionpercent: updated.completionPercent,
      progress: updated.progress,
      currentstage: updated.currentStage,
      affectedunits: updated.affectedUnits,
      pressureloss: updated.pressureLoss,
      unitenroute: updated.unitEnRoute,
      imagedata: updated.imageData,
      imagepath: updated.imagePath,
      aifindings: updated.aiFindings,
      generatedat: updated.generatedAt,
      reportkey: updated.reportKey
    };

    const { error } = await supabase
      .from("incidents")
      .update(dbIncident)
      .eq("id", id);

    if (error) throw error;
    return updated;
  }

  static async updateIncidentProgress(
    id: string,
    progressData: { assignee?: string; progress?: string; completionPercent?: number; currentStage?: string }
  ): Promise<Incident | null> {
    const incident = await this.getIncidentById(id);
    if (!incident) return null;

    const updated = { ...incident };
    if (progressData.assignee !== undefined) updated.assignee = progressData.assignee;
    if (progressData.progress !== undefined) updated.progress = progressData.progress;
    if (progressData.completionPercent !== undefined) updated.completionPercent = progressData.completionPercent;
    if (progressData.currentStage !== undefined) updated.currentStage = progressData.currentStage;

    const dbIncident = {
      id: updated.id,
      title: updated.title,
      category: updated.category,
      department: updated.department,
      severity: updated.severity,
      priority: updated.priority,
      status: updated.status,
      description: updated.description,
      location: updated.location,
      address: updated.address,
      latitude: updated.latitude,
      longitude: updated.longitude,
      ticketid: updated.ticketId,
      ticketnumber: updated.ticketNumber,
      assignee: updated.assignee,
      kanbanstatus: updated.kanbanStatus,
      timelogged: updated.timeLogged,
      aiscore: updated.aiScore,
      completionpercent: updated.completionPercent,
      progress: updated.progress,
      currentstage: updated.currentStage,
      affectedunits: updated.affectedUnits,
      pressureloss: updated.pressureLoss,
      unitenroute: updated.unitEnRoute,
      imagedata: updated.imageData,
      imagepath: updated.imagePath,
      aifindings: updated.aiFindings,
      generatedat: updated.generatedAt,
      reportkey: updated.reportKey
    };

    const { error } = await supabase
      .from("incidents")
      .update(dbIncident)
      .eq("id", id);

    if (error) throw error;
    return updated;
  }

  static async deleteIncident(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("incidents")
      .delete()
      .eq("id", id);

    if (error) return false;
    return true;
  }
}
