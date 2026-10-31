import {strict as assert} from 'node:assert';
import {hubrysComponentApp} from './componentApp';
assert.equal(hubrysComponentApp.manifest.id,'kult');
assert.ok(hubrysComponentApp.backend.listServices().includes('workspace'));
assert.equal(hubrysComponentApp.backend.hasCapability('workspace.getWorkspaces'),true);
