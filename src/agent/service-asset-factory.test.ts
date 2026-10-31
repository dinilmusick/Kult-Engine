import {describe, expect, it} from "vitest";
import {kultServiceAssetContract} from "./service-asset-factory.js";

describe("Kult AI service asset contract", () => {
  it("declares the service factory capabilities", () => {
    expect(kultServiceAssetContract.capabilities).toContain("service.create");
    expect(kultServiceAssetContract.capabilities).toContain("service.validate");
    expect(kultServiceAssetContract.capabilities).toContain("service.promote");
  });
});
