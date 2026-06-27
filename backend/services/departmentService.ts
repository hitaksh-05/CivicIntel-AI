import { readJSON, writeJSON } from "../utils/jsonHelper";
import { SubsystemStatus, Incident } from "../types";

export class DepartmentService {
  private static FILE_NAME = "departments.json";

  static async getAllDepartments(): Promise<SubsystemStatus[]> {
    const departments = await readJSON<SubsystemStatus[]>(this.FILE_NAME);
    const incidents = await readJSON<Incident[]>("incidents.json");

    // Dynamic mapping of stats
    return departments.map(d => {
      // Find incidents related to this department
      const deptIncidents = incidents.filter(i => 
        i.department.toLowerCase().includes(d.name.toLowerCase().substring(0, 5)) ||
        i.category.toLowerCase().includes(d.name.toLowerCase().substring(0, 5))
      );

      const openIncidents = deptIncidents.filter(i => i.status !== "Resolved").length;
      const completedIncidents = deptIncidents.filter(i => i.status === "Resolved").length;

      // Workload assessment
      let workload: "Low" | "Moderate" | "High" = "Low";
      if (openIncidents > 3) workload = "High";
      else if (openIncidents > 1) workload = "Moderate";

      // Sync health dynamically based on open incidents severity
      let health = d.health;
      if (openIncidents > 0) {
        const hasCritical = deptIncidents.some(i => i.status !== "Resolved" && i.severity === "Critical");
        const hasHigh = deptIncidents.some(i => i.status !== "Resolved" && i.severity === "High");
        if (hasCritical) {
          health = 68.4;
        } else if (hasHigh) {
          health = 82.5;
        }
      } else {
        health = 98.0; // Restored health
      }

      // Sync status
      let status = d.status;
      if (health < 70) status = "Critical";
      else if (health < 85) status = "Action Required";
      else if (health < 95) status = "Active Sync";
      else status = "Optimal";

      return {
        ...d,
        health,
        status,
        openIncidents,
        completedIncidents: d.completedIncidents ? d.completedIncidents + completedIncidents : completedIncidents,
        workload,
        performance: health
      };
    });
  }

  static async getDepartmentById(id: string): Promise<SubsystemStatus | null> {
    const depts = await this.getAllDepartments();
    return depts.find(d => d.id === id) || null;
  }
}
