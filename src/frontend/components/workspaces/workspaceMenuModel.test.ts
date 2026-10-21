import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceDraft, shouldShowWorkspaceMenu } from "./workspaceMenuModel";

test("Kult always enters the workspace menu after authentication until a workspace is explicitly selected", () => {
  assert.equal(shouldShowWorkspaceMenu(true, false), true);
  assert.equal(shouldShowWorkspaceMenu(true, true), false);
  assert.equal(shouldShowWorkspaceMenu(false, false), false);
});

test("local workspace drafts contain a deterministic workspace root", () => {
  assert.deepEqual(createWorkspaceDraft("  Demo  ", "local"), {
    name: "Demo",
    workspacePath: "/workspaces",
    storageProvider: "local",
    storageConfig: { rootPath: "/workspaces" },
  });
});

test("Backblaze workspace drafts carry bucket configuration separately from local paths", () => {
  assert.deepEqual(createWorkspaceDraft("Cloud", "backblaze"), {
    name: "Cloud",
    workspacePath: undefined,
    storageProvider: "backblaze",
    storageConfig: { bucketName: "", endpoint: "" },
  });
});
