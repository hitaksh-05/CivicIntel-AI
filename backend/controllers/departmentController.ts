import { Request, Response } from "express";
import { DepartmentService } from "../services/departmentService";

export class DepartmentController {
  static async getAllDepartments(req: Request, res: Response): Promise<void> {
    try {
      const departments = await DepartmentService.getAllDepartments();
      res.json(departments);
    } catch (error: any) {
      console.error("DepartmentController.getAllDepartments Error:", error);
      res.status(500).json({ error: "Failed to retrieve departments status" });
    }
  }

  static async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const department = await DepartmentService.getDepartmentById(id);
      if (!department) {
        res.status(404).json({ error: "Department not found" });
        return;
      }
      res.json(department);
    } catch (error: any) {
      console.error("DepartmentController.getDepartmentById Error:", error);
      res.status(500).json({ error: "Failed to retrieve department details" });
    }
  }
}
