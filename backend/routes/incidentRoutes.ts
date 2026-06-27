import { Router } from "express";
import { IncidentController } from "../controllers/incidentController";

const router = Router();

router.get("/incidents", IncidentController.getAllIncidents);
router.get("/incidents/:id", IncidentController.getIncidentById);
router.post("/incidents", IncidentController.createIncident);
router.put("/incidents/:id", IncidentController.updateIncident);
router.patch("/incidents/:id/status", IncidentController.updateIncidentStatus);
router.patch("/incidents/:id/progress", IncidentController.updateIncidentProgress);
router.delete("/incidents/:id", IncidentController.deleteIncident);

export default router;
