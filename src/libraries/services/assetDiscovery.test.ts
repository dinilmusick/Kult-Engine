import test from "node:test";
import assert from "node:assert/strict";
import { createLocalServiceFromKloksAsset, getKloksServiceAsset } from "./assetDiscovery";

test("KLOKS service assets can be resolved by export", () => {
  const asset = getKloksServiceAsset("ServiceAFacade");
  assert.ok(asset);
  assert.equal(asset?.category, "services");
});

test("copying a KLOKS service preserves provenance and produces editable local metadata", () => {
  const asset = getKloksServiceAsset("ServiceAFacade");
  assert.ok(asset);
  const local = createLocalServiceFromKloksAsset(asset!);
  assert.equal(local.document.metadata.provenance.source, "KLOKS");
  assert.equal(local.document.assets[0].export, "ServiceAFacade");
  assert.equal(local.document.service.name, asset!.name);
});
