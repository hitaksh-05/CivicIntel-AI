import { Router } from "express";
import { AnalysisController } from "../controllers/analysisController";

const router = Router();

router.post("/ai-query", AnalysisController.queryAI);
router.post("/analyze-incident", AnalysisController.analyzeIncident);

export default router;
