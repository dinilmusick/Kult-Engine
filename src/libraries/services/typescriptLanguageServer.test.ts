import { describe, expect, it } from 'vitest';
import { TypeScriptLanguageServerClient } from './typescriptLanguageServer.js';

describe('TypeScriptLanguageServerClient', () => {
  it('exposes the canonical KLOKS service operations', () => {
    expect(Object.keys(TypeScriptLanguageServerClient)).toEqual(
      expect.arrayContaining(['start', 'request', 'notify', 'stop', 'status']),
    );
  });
});
