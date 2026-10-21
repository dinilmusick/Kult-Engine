import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFunctionalityContext,
  createFunctionalityAsset,
  normalizeFunctionalityAsset,
  removeEvent,
  removeHelper,
  setFunctionalityLibrary,
  upsertEvent,
  upsertHelper,
} from './functionalityEditorModel';

test('functionality context exposes state, helpers, events, and libraries', () => {
  const asset = createFunctionalityAsset({ id: 'fn-1', name: 'authenticate' });
  const withHelper = upsertHelper(asset, {
    id: 'helper-1',
    name: 'hashPassword',
    signature: 'declare function hashPassword(value: string): Promise<string>;',
    implementation: 'export async function hashPassword(value: string) { return value; }',
  });
  const withEvent = upsertEvent(withHelper, {
    id: 'event-1',
    name: 'onAuthenticated',
    signature: 'declare function onAuthenticated(userId: string): void;',
    implementation: 'function onAuthenticated(userId: string) {}',
  });
  const context = buildFunctionalityContext(withEvent);
  assert.match(context.declaration, /StateData/);
  assert.match(context.declaration, /hashPassword/);
  assert.match(context.declaration, /onAuthenticated/);
  assert.deepEqual(context.libraryNames, ['@ultrst-armada/gutts']);
});

test('helper and event additions/removals update the asset', () => {
  const asset = createFunctionalityAsset({ id: 'fn-1', name: 'foo' });
  const helper = { id: 'h', name: 'h', signature: 'declare function h(): void;', implementation: 'function h() {}' };
  const event = { id: 'e', name: 'e', signature: 'declare function e(): void;', implementation: 'function e() {}' };
  const updated = upsertEvent(upsertHelper(asset, helper), event);
  assert.equal(updated.helpers.length, 1);
  assert.equal(updated.events.length, 1);
  assert.equal(removeHelper(updated, 'h').helpers.length, 0);
  assert.equal(removeEvent(updated, 'e').events.length, 0);
});

test('libraries are deduplicated and gutts cannot be removed', () => {
  const asset = createFunctionalityAsset({ id: 'fn-1', name: 'foo' });
  const unchanged = setFunctionalityLibrary(asset, '@ultrst-armada/gutts');
  assert.deepEqual(unchanged.libraries, ['@ultrst-armada/gutts']);
  const updated = setFunctionalityLibrary(asset, 'zod');
  assert.deepEqual(updated.libraries, ['@ultrst-armada/gutts', 'zod']);
  assert.deepEqual(removeHelper(updated, 'missing'), updated.helpers);
  assert.deepEqual(
    removeEvent(updated, 'missing'),
    updated,
  );
});

test('legacy functionality metadata receives safe editor defaults', () => {
  const normalized = normalizeFunctionalityAsset(undefined, {
    id: 'fn-1',
    name: 'legacy',
    description: '',
    inputSignature: 'Input',
    outputSignature: 'Output',
    tags: [],
  });
  assert.match(normalized.mainFunction, /export async function main/);
  assert.match(normalized.stateData, /interface StateData/);
  assert.deepEqual(normalized.helpers, []);
  assert.deepEqual(normalized.events, []);
  assert.deepEqual(normalized.libraries, ['@ultrst-armada/gutts']);
});
