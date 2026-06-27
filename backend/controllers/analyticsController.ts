import { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsService";

export class AnalyticsController {
  static async getAnalyticsData(req: Request, res: Response): Promise<void> {
    try {
      const data = await AnalyticsService.getAnalyticsData();
      res.json(data);
    } catch (error: any) {
      console.error("AnalyticsController.getAnalyticsData Error:", error);
      res.status(500).json({ error: "Failed to retrieve analytics data" });
    }
  }
}
