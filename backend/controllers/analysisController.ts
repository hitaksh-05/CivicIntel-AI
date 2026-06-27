import { Request, Response } from "express";
import { GeminiService } from "../services/gemini";

export class AnalysisController {
  static async queryAI(req: Request, res: Response): Promise<void> {
    try {
      const { query, history } = req.body;
      if (!query) {
        res.status(400).json({ error: "Query is required" });
        return;
      }
      const response = await GeminiService.queryAI(query, history || []);
      res.json(response);
    } catch (error: any) {
      console.error("AnalysisController.queryAI Error:", error);
      res.status(500).json({ error: "Failed to generate AI query response" });
    }
  }

  static async analyzeIncident(req: Request, res: Response): Promise<void> {
    try {
      const { category, location, description, severity, imageData } = req.body;
      const response = await GeminiService.analyzeIncident(
        category || "General",
        location || "Unknown Coordinates",
        description || "None",
        severity || "Moderate",
        imageData
      );
      res.json(response);
    } catch (error: any) {
      console.error("AnalysisController.analyzeIncident Error:", error);
      res.status(500).json({ error: "Failed to run incident diagnostics" });
    }
  }
}
