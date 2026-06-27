import { Request, Response } from "express";
import { DashboardService } from "../services/dashboardService";

export class DashboardController {
  static async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardService.getDashboardData();
      res.json(data);
    } catch (error: any) {
      console.error("DashboardController Error:", error);
      res.status(500).json({ error: "Failed to load dashboard data" });
    }
  }
}
