import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {kultServiceAssetContract} from "./service-asset-factory.js";

describe("Kult AI service asset contract", () => {
  it("declares the service factory capabilities", () => {
    assert.ok(kultServiceAssetContract.capabilities.includes("service.create"));
    assert.ok(kultServiceAssetContract.capabilities.includes("service.validate"));
    assert.ok(kultServiceAssetContract.capabilities.includes("service.promote"));
  });
});
