import { Router } from "express";
import { DepartmentController } from "../controllers/departmentController";

const router = Router();

router.get("/departments", DepartmentController.getAllDepartments);
router.get("/departments/:id", DepartmentController.getDepartmentById);

export default router;
