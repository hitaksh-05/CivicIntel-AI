import { readJSON, writeJSON } from "../utils/jsonHelper";
import { PredictData } from "../types";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export class PredictionService {
  private static FILE_NAME = "predictions.json";

  static async getPredictions(): Promise<PredictData> {
    return await readJSON<PredictData>(this.FILE_NAME);
  }

  static async triggerPredictions(queryContext?: string): Promise<PredictData> {
    const cachedData = await this.getPredictions();

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY missing, using cached predictive data.");
      return cachedData;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a Smart City Predictive Engineering Engine.
Generate detailed failure probabilities, infrastructure load forecasts, risks, and budget estimations based on the following context: ${queryContext || "Nominal state, active Sector 9 water main detour, Sector 7G Overpass micro-cracks under thermal load."}

Return a JSON object that strictly matches this schema:
{
  "predictiveBarData": [
    { "sector": "Sector 1", "currentLoad": number, "failureProb": number },
    { "sector": "Sector 3", "currentLoad": number, "failureProb": number },
    { "sector": "Sector 4", "currentLoad": number, "failureProb": number },
    { "sector": "Sector 7", "currentLoad": number, "failureProb": number },
    { "sector": "Sector 9", "currentLoad": number, "failureProb": number }
  ],
  "subsystemRadarData": [
    { "subject": "Power Grid", "A": number, "B": number, "fullMark": 150 },
    { "subject": "Water Main", "A": number, "B": number, "fullMark": 150 },
    { "subject": "Transit Flow", "A": number, "B": number, "fullMark": 150 },
    { "subject": "Structural", "A": number, "B": number, "fullMark": 150 },
    { "subject": "Comms Net", "A": number, "B": number, "fullMark": 150 },
    { "subject": "Public Safety", "A": number, "B": number, "fullMark": 150 }
  ],
  "maintenanceRecommendations": [
    { "id": "string", "assetName": "string", "code": "string", "timeRemaining": "string", "urgency": "urgent" | "normal" | "critical" }
  ],
  "risks": [
    { "id": "string", "title": "string", "badge": "string", "description": "string", "severity": "LOW" | "MODERATE" | "HIGH" | "CRITICAL", "prob": number, "recommendation": "string" }
  ],
  "budgetEstimations": {
    "recommendedMaintenance": number,
    "emergencyMitigation": number,
    "structuralShoring": number
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text || "{}");
      
      // Update predictions
      const updatedData: PredictData = {
        predictiveBarData: parsed.predictiveBarData || cachedData.predictiveBarData,
        subsystemRadarData: parsed.subsystemRadarData || cachedData.subsystemRadarData,
        maintenanceRecommendations: parsed.maintenanceRecommendations || cachedData.maintenanceRecommendations,
        risks: parsed.risks || cachedData.risks,
        budgetEstimations: parsed.budgetEstimations || cachedData.budgetEstimations
      };

      await writeJSON(this.FILE_NAME, updatedData);
      return updatedData;
    } catch (error) {
      console.error("Failed to run predictive AI simulation, falling back:", error);
      return cachedData;
    }
  }
}
