import { Request, Response } from "express";
import { PredictionService } from "../services/predictionService";

export class PredictionController {
  static async getPredictions(req: Request, res: Response): Promise<void> {
    try {
      const data = await PredictionService.getPredictions();
      res.json(data);
    } catch (error: any) {
      console.error("PredictionController.getPredictions Error:", error);
      res.status(500).json({ error: "Failed to retrieve predictive data" });
    }
  }

  static async triggerPredictions(req: Request, res: Response): Promise<void> {
    try {
      const { context } = req.body;
      const data = await PredictionService.triggerPredictions(context);
      res.json(data);
    } catch (error: any) {
      console.error("PredictionController.triggerPredictions Error:", error);
      res.status(500).json({ error: "Failed to recalculate predictions" });
    }
  }
}
