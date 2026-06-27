import { Request, Response } from "express";
import { IncidentService } from "../services/incidentService";

export class IncidentController {
  static async getAllIncidents(req: Request, res: Response): Promise<void> {
    try {
      const incidents = await IncidentService.getAllIncidents();
      res.json(incidents);
    } catch (error: any) {
      console.error("IncidentController.getAllIncidents Error:", error);
      res.status(500).json({ error: "Failed to retrieve incidents" });
    }
  }

  static async getIncidentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const incident = await IncidentService.getIncidentById(id);
      if (!incident) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }
      res.json(incident);
    } catch (error: any) {
      console.error("IncidentController.getIncidentById Error:", error);
      res.status(500).json({ error: "Failed to retrieve incident" });
    }
  }

  static async createIncident(req: Request, res: Response): Promise<void> {
    try {
      const newIncident = await IncidentService.createIncident(req.body);
      res.status(201).json(newIncident);
    } catch (error: any) {
      console.error("IncidentController.createIncident Error:", error);
      res.status(500).json({ error: "Failed to create incident" });
    }
  }

  static async updateIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await IncidentService.updateIncident(id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      console.error("IncidentController.updateIncident Error:", error);
      res.status(500).json({ error: "Failed to update incident" });
    }
  }

  static async updateIncidentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: "Status is required" });
        return;
      }
      const updated = await IncidentService.updateIncidentStatus(id, status);
      if (!updated) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      console.error("IncidentController.updateIncidentStatus Error:", error);
      res.status(500).json({ error: "Failed to update incident status" });
    }
  }

  static async updateIncidentProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await IncidentService.updateIncidentProgress(id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      console.error("IncidentController.updateIncidentProgress Error:", error);
      res.status(500).json({ error: "Failed to update incident progress" });
    }
  }

  static async deleteIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await IncidentService.deleteIncident(id);
      if (!success) {
        res.status(404).json({ error: "Incident not found" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("IncidentController.deleteIncident Error:", error);
      res.status(500).json({ error: "Failed to delete incident" });
    }
  }
}
