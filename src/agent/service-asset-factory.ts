export type KultAssetKind = "service" | "functionality" | "service-ui" | "service-test";

export interface KultAssetRequest {
  kind: KultAssetKind;
  name: string;
  description?: string;
  source?: string;
  dependencies?: readonly string[];
}

export interface KultAssetResult {
  assetId: string;
  kind: KultAssetKind;
  status: "draft" | "verified" | "promotion-candidate";
  files: readonly string[];
  testCommands: readonly string[];
}

export interface KultServiceAssetFactory {
  create(request: KultAssetRequest): Promise<KultAssetResult>;
  validate(assetId: string): Promise<KultAssetResult>;
}

export const kultServiceAssetContract = {
  id: "kult.service-asset-factory",
  capabilities: ["service.create", "service.validate", "service.test", "service.promote"],
} as const;
