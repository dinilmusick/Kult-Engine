import * as KloksDevelopment from '@ultrst-armada/kloks/development';

export interface LanguageServerFacade {
  execute<TIn = unknown, TOut = unknown>(operation: string, input?: TIn): Promise<TOut>;
}

function facade(): LanguageServerFacade {
  const value = (KloksDevelopment as Record<string, unknown>).TypeScriptLanguageServerServiceFacade;
  if (!value || typeof value !== 'object') {
    throw new Error('KLOKS TypeScriptLanguageServerService is unavailable; consume a KLOKS release that exports the service.');
  }
  return value as LanguageServerFacade;
}

export const TypeScriptLanguageServerClient = {
  start: (input: { cwd?: string; install?: boolean; version?: string } = {}) =>
    facade().execute('start', input),
  request: <T = unknown>(input: { id: number | string; method: string; params?: unknown }) =>
    facade().execute<typeof input, T>('request', input),
  notify: (input: { method: string; params?: unknown }) =>
    facade().execute('notify', input),
  stop: () => facade().execute('stop'),
  status: () => facade().execute('status'),
};
