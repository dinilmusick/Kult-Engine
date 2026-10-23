import assert from 'node:assert/strict';
import { TypeScriptLanguageServerClient } from './typescriptLanguageServer.js';

assert.deepEqual(Object.keys(TypeScriptLanguageServerClient).sort(), ['notify', 'request', 'start', 'status', 'stop']);
