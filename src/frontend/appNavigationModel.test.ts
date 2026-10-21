import test from "node:test";
import assert from "node:assert/strict";
import { nextScreenAfterWorkspaceSelection, shouldRenderLegacyWorkspace } from "./appNavigationModel";

test("workspace selection opens the new services tile menu", () => {
  assert.equal(nextScreenAfterWorkspaceSelection(), "services");
});

test("legacy KultWorkspace is never selected by the new navigation", () => {
  assert.equal(shouldRenderLegacyWorkspace(false), false);
  assert.equal(shouldRenderLegacyWorkspace(true), false);
});
