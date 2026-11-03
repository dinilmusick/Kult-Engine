import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCiWorkflowRun } from "./ciDiagnosticsModel";

test("normalizes workflow state and exact commit evidence", () => {
  const result = normalizeCiWorkflowRun({
    id: 42, name: "Kult CI", status: "completed", conclusion: "success",
    head_branch: "main", head_sha: "a".repeat(40),
    html_url: "https://github.com/dinilmusick/Kult-Engine/actions/runs/42",
  }, "dinilmusick/Kult-Engine");
  assert.equal(result.name, "Kult CI");
  assert.equal(result.conclusion, "success");
  assert.equal(result.commit, "a".repeat(40));
  assert.equal(result.url, "https://github.com/dinilmusick/Kult-Engine/actions/runs/42");
});

test("normalizes incomplete workflow payloads safely", () => {
  const result = normalizeCiWorkflowRun({ id: 9 }, "dinilmusick/Kult-Engine");
  assert.equal(result.status, "unknown");
  assert.equal(result.branch, "unknown");
  assert.equal(result.conclusion, null);
  assert.equal(result.url, "https://github.com/dinilmusick/Kult-Engine/actions/runs/9");
});
