import { strict as assert } from 'node:assert';
import { hubrysComponentApp } from './componentApp.js';

assert.equal(hubrysComponentApp.manifest.id, 'kult');
assert.ok(hubrysComponentApp.backend.listServices().includes('workspace'));
assert.ok(hubrysComponentApp.backend.listServices().includes('service'));
assert.equal(hubrysComponentApp.backend.hasCapability('workspace.getWorkspaces'), true);

// 1. service.create
const created = await hubrysComponentApp.backend.executeCapability<{ id?: string; name: string }, any>('service.create', undefined, { name: 'CalculatorService' });
assert.equal(created.success, true);
assert.equal(created.document.service.name, 'CalculatorService');

// 2. service.inspect
const inspected = await hubrysComponentApp.backend.executeCapability<{ serviceId: string }, any>('service.inspect', undefined, { serviceId: created.serviceId });
assert.equal(inspected.success, true);
assert.ok(inspected.nodesCount > 0);

// 3. service.edit
const edited = await hubrysComponentApp.backend.executeCapability<{ serviceId: string; patch: any }, any>('service.edit', undefined, {
  serviceId: created.serviceId,
  patch: { service: { ...created.document.service, description: 'Updated Calculator' } },
});
assert.equal(edited.success, true);
assert.equal(edited.document.service.description, 'Updated Calculator');

// 4. service.run
const runRes = await hubrysComponentApp.backend.executeCapability<{ serviceId: string; inputs: any }, any>('service.run', undefined, {
  serviceId: created.serviceId,
  inputs: { a: 15, b: 25, operation: 'add' },
});
assert.equal(runRes.status, 'passed');
assert.equal(runRes.output.result, 40);

// 5. service.validate
const validReport = await hubrysComponentApp.backend.executeCapability<{ serviceId: string }, any>('service.validate', undefined, { serviceId: created.serviceId });
assert.equal(validReport.ok, true, JSON.stringify(validReport));

// 6. service.test
const testReport = await hubrysComponentApp.backend.executeCapability<{ serviceId: string }, any>('service.test', undefined, { serviceId: created.serviceId });
assert.equal(testReport.success, true);

// 7. service.promote
const promo = await hubrysComponentApp.backend.executeCapability<{ serviceId: string }, any>('service.promote', undefined, { serviceId: created.serviceId });
assert.equal(promo.success, true);
assert.ok(promo.packageName);
assert.ok(promo.filesCount > 0);

console.log('Kult Hubrys component contract with full service suite passed');
