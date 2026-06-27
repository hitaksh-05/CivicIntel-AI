import { readJSON } from "../utils/jsonHelper";

export class AnalyticsService {
  static async getAnalyticsData(): Promise<any> {
    return await readJSON<any>("analytics.json");
  }
}
