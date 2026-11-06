import assert from "node:assert/strict";
import test from "node:test";
import {
  clearKultDeploymentAdapters,
  kultServiceAuthoring,
  registerKultDeploymentAdapter,
} from "./kultServiceAuthoring.js";

test("Kult lifecycle exposes create/update/validate/lint/constrain", async () => {
  const created = await kultServiceAuthoring.create({ id: "lifecycle-service", name: "Lifecycle Service" });
  assert.equal(created.success, true);
  const updated = await kultServiceAuthoring.update({
    serviceId: created.serviceId,
    patch: { service: { ...created.document.service, description: "updated" } },
  });
  assert.equal(updated.success, true);
  assert.equal((await kultServiceAuthoring.validate({ serviceId: created.serviceId })).ok, true);
  assert.equal((await kultServiceAuthoring.lint({ serviceId: created.serviceId })).success, true);
  assert.equal((await kultServiceAuthoring.constrain({ serviceId: created.serviceId })).success, true);
});

test("Kult lifecycle executes mock, debug and execute stages with diagnostics", async () => {
  const input = { a: 7, b: 5, operation: "add" };
  const mock = await kultServiceAuthoring.mockTest({ inputs: input });
  assert.equal(mock.success, true, JSON.stringify(mock));
  const debug = await kultServiceAuthoring.debug({ inputs: input });
  assert.equal(debug.success, true, JSON.stringify(debug));
  assert.equal(debug.diagnostics.logs.length > 0, true);
  assert.deepEqual(debug.diagnostics.errors, []);
  const execution = await kultServiceAuthoring.execute({ inputs: input });
  assert.equal(execution.status, "passed", JSON.stringify(execution));
});

test("Kult lifecycle build stage returns a validated Kloks artifact", async () => {
  const result = await kultServiceAuthoring.build({ verify: false });
  assert.equal(result.success, true, JSON.stringify(result));
  assert.equal(result.artifact.files.length > 0, true);
  assert.equal(typeof result.artifact.packageName, "string");
});

test("Kult lifecycle deploy stage uses a scoped deployment adapter", async () => {
  clearKultDeploymentAdapters();
  let observed = "";
  registerKultDeploymentAdapter("test-runtime", async ({ serviceId, target, artifact }) => {
    observed = serviceId + ":" + target + ":" + artifact.packageName;
    return { deploymentId: "dep-test", endpoint: "https://example.test/service" };
  });
  try {
    const result = await kultServiceAuthoring.deploy({ target: "test-runtime", verify: false });
    assert.equal(result.success, true, JSON.stringify(result));
    assert.equal(result.status, "deployed");
    assert.match(observed, /^svc-kloks-arithmetic:test-runtime:/);
    assert.equal((result.deployment as { deploymentId: string }).deploymentId, "dep-test");
  } finally {
    clearKultDeploymentAdapters();
  }
});

test("Kult lifecycle typecheck returns structured command diagnostics", async () => {
  const result = await kultServiceAuthoring.typecheck({ timeoutMs: 120_000 });
  assert.equal(typeof result.success, "boolean");
  assert.equal(typeof result.engineering.ok, "boolean");
  assert.equal(result.typecheck?.command.includes("tsc --noEmit"), true);
});
