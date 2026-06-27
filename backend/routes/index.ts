import { Router } from "express";
import dashboardRoutes from "./dashboardRoutes";
import incidentRoutes from "./incidentRoutes";
import analysisRoutes from "./analysisRoutes";
import predictionRoutes from "./predictionRoutes";
import departmentRoutes from "./departmentRoutes";
import analyticsRoutes from "./analyticsRoutes";

const router = Router();

router.use(dashboardRoutes);
router.use(incidentRoutes);
router.use(analysisRoutes);
router.use(predictionRoutes);
router.use(departmentRoutes);
router.use(analyticsRoutes);

export default router;
