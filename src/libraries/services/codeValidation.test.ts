import { describe, expect, it } from 'vitest';
import { validateKultService } from './codeValidation';

describe('Kult code validation', () => {
  it('rejects semantically invalid service documents before WebContainer execution', async () => {
    const result = await validateKultService({ service: { id: '', name: '', version: '', description: '', inputPorts: [], outputPorts: [] }, nodes: [], edges: [], assets: [], tests: [], metadata: {} } as any);
    expect(result.ok).toBe(false);
    expect(result.code.failedLayers).toEqual([]);
  });
});
