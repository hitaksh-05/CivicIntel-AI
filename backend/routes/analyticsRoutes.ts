import { Router } from "express";
import { AnalyticsController } from "../controllers/analyticsController";

const router = Router();

router.get("/analytics", AnalyticsController.getAnalyticsData);

export default router;
