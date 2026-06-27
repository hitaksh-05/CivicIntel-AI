import { Router } from "express";
import { PredictionController } from "../controllers/predictionController";

const router = Router();

router.get("/predictions", PredictionController.getPredictions);
router.post("/predict", PredictionController.triggerPredictions);

export default router;
