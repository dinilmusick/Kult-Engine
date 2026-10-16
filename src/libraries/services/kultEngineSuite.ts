/**
 * @file kultEngineSuite.ts
 * @description In-memory test suite for Kult Engine core contracts (§9 & §29 of IMPLEMENTATION-SPEC.md).
 * Validates discovery, DAG checks, KRNLTS execution, KLOKS artifact export, import, and round-trip parity.
 */

import { discoverKloksAssets } from './assetDiscovery';
import { validateServiceDocument } from './graphValidator';
import { executeServiceGraph } from './graphExecutor';
import { generateKloksArtifact } from './kloksExporter';
import { importKloksServiceCandidate } from './kloksImporter';
import { runRoundTripTest } from './roundTripTester';
import { STARTER_KLOKS_ARITHMETIC_SERVICE } from './starterServices';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runAllKultEngineContractTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Real Asset Discovery
  try {
    const assets = discoverKloksAssets();
    const hasServiceA = assets.some((a) => a.export === 'ServiceAFacade');
    const hasServiceB = assets.some((a) => a.export === 'ServiceBFacade');
    if (assets.length >= 5 && hasServiceA && hasServiceB) {
      results.push({ name: 'Asset Discovery: Authoritative KLOKS assets discovered', passed: true });
    } else {
      results.push({ name: 'Asset Discovery: Missing expected facades', passed: false, error: 'Incomplete discovery' });
    }
  } catch (e: any) {
    results.push({ name: 'Asset Discovery', passed: false, error: e.message });
  }

  // Test 2: Continuous Graph Validation
  try {
    const validReport = validateServiceDocument(STARTER_KLOKS_ARITHMETIC_SERVICE);
    if (!validReport.isValid) throw new Error('Starter service reported invalid');

    // Create a cyclic service to verify DAG rejection
    const cyclicDoc = JSON.parse(JSON.stringify(STARTER_KLOKS_ARITHMETIC_SERVICE));
    cyclicDoc.edges.push({
      id: 'cycle-back',
      sourceNodeId: 'node-out',
      sourcePort: 'p-res-in',
      targetNodeId: 'node-in',
      targetPort: 'p-op',
    });
    const cyclicReport = validateServiceDocument(cyclicDoc);
    if (!cyclicReport.isValid && cyclicReport.errors.some((err) => err.code === 'ERR_CYCLE')) {
      results.push({ name: 'Graph Validation: Strict DAG cycle detection verified', passed: true });
    } else {
      results.push({ name: 'Graph Validation: Failed to detect cyclic loop', passed: false });
    }
  } catch (e: any) {
    results.push({ name: 'Graph Validation', passed: false, error: e.message });
  }

  // Test 3: Real KRNLTS Execution
  try {
    const run = await executeServiceGraph(STARTER_KLOKS_ARITHMETIC_SERVICE, { a: 30, b: 20, operation: 'add' });
    if (run.status === 'passed' && (run.output as any).result === 50) {
      results.push({ name: 'KRNLTS Execution: Real Service A addition executed accurately (30+20=50)', passed: true });
    } else {
      results.push({ name: 'KRNLTS Execution: Calculation mismatch', passed: false, error: JSON.stringify(run.output) });
    }
  } catch (e: any) {
    results.push({ name: 'KRNLTS Execution', passed: false, error: e.message });
  }

  // Test 4: KLOKS Artifact Generator
  try {
    const artifact = generateKloksArtifact(STARTER_KLOKS_ARITHMETIC_SERVICE);
    const hasSource = artifact.files.some((f) => f.path === 'src/index.ts' && f.content.includes('createService'));
    const hasManifest = Boolean(artifact.manifest.serviceId);
    if (hasSource && hasManifest && artifact.contractDiff.versionRecommendation === 'MINOR') {
      results.push({ name: 'KLOKS Export: Compiled KRNLTS service pipeline and manifest generated', passed: true });
    } else {
      results.push({ name: 'KLOKS Export: Artifact missing required source or manifest', passed: false });
    }
  } catch (e: any) {
    results.push({ name: 'KLOKS Export', passed: false, error: e.message });
  }

  // Test 5: Existing KLOKS Service Import
  try {
    const importedDoc = importKloksServiceCandidate('kloks.service.b');
    const hasFacadeNode = importedDoc.nodes.some((n) => n.type === 'ServiceBFacade');
    if (importedDoc.service.id === 'kloks.service.b' && hasFacadeNode) {
      results.push({ name: 'KLOKS Import: CODE_IMPORTED facade boundary reconstructed into SERVICE_IR', passed: true });
    } else {
      results.push({ name: 'KLOKS Import: Imported document missing expected facade', passed: false });
    }
  } catch (e: any) {
    results.push({ name: 'KLOKS Import', passed: false, error: e.message });
  }

  // Test 6: Round-Trip Regression Verification
  try {
    const roundTrip = await runRoundTripTest(STARTER_KLOKS_ARITHMETIC_SERVICE, { a: 45, b: 15, operation: 'add' });
    if (roundTrip.success && roundTrip.parityVerified && (roundTrip.originalOutput as any).result === 60) {
      results.push({ name: 'Round-Trip Parity: Graph -> Artifact -> Compiled Execution 100% bitwise parity', passed: true });
    } else {
      results.push({ name: 'Round-Trip Parity: Drift detected between graph and compiled output', passed: false });
    }
  } catch (e: any) {
    results.push({ name: 'Round-Trip Parity', passed: false, error: e.message });
  }

  return results;
}
