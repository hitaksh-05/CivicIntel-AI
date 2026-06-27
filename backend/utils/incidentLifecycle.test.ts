import assert from "node:assert/strict";
import { normalizeIncidentData } from "./incidentLifecycle";

const normalized = normalizeIncidentData({
  category: "Water Leak",
  severity: "High",
  status: "Dispatched"
});

assert.equal(normalized.department, "Water & Sewage");
assert.equal(normalized.severity, "High");
assert.equal(normalized.priority, "High");
assert.equal(normalized.status, "En Route");
assert.equal(normalized.kanbanStatus, "in_progress");
assert.equal(normalized.lifecycleStage, "Dispatched");
assert.equal(normalized.completionPercent, 10);

const triage = normalizeIncidentData({ status: "todo" });
assert.equal(triage.kanbanStatus, "todo");
assert.equal(triage.currentStage, "Queued");

const dispatched = normalizeIncidentData({ status: "in_progress" });
assert.equal(dispatched.kanbanStatus, "in_progress");
assert.equal(dispatched.currentStage, "Dispatched");
assert.equal(dispatched.status, "En Route");

const reviewStage = normalizeIncidentData({ status: "review" });
assert.equal(reviewStage.kanbanStatus, "review");
assert.equal(reviewStage.currentStage, "AI Analysis");

const resolved = normalizeIncidentData({ status: "completed" });
assert.equal(resolved.kanbanStatus, "completed");
assert.equal(resolved.currentStage, "Resolved");
assert.equal(resolved.status, "Resolved");

console.log("incident lifecycle normalization ok");
