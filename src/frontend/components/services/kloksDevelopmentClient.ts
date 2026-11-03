import { WebContainer, type WebContainerProcess } from '@webcontainer/api';

type Files = Record<string, unknown>;
type Env = Record<string, string | number | boolean>;
type Result = { exitCode: number; output: string };

let container: Awaited<ReturnType<typeof WebContainer.boot>> | null = null;
let bootPromise: Promise<Awaited<ReturnType<typeof WebContainer.boot>>> | null = null;

async function getContainer() {
  if (container) return container;
  bootPromise ??= WebContainer.boot({ coep: 'require-corp', workdirName: 'kult-development' });
  container = await bootPromise;
  return container;
}

async function collect(process: WebContainerProcess): Promise<Result> {
  let output = '';
  const reader = process.output.getReader();
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      output += next.value;
    }
  } finally {
    reader.releaseLock();
  }
  return { exitCode: await process.exit, output };
}

export const WebContainerServiceFacade = {
  execute: async <TIn = unknown, TOut = unknown>(operation: string, input?: TIn): Promise<TOut> => {
    const c = await getContainer();
    switch (operation) {
      case 'boot':
        return { ready: true } as TOut;
      case 'mount': {
        const value = input as { files: Files; mountPoint?: string };
        await c.mount(value.files as any, value.mountPoint ? { mountPoint: value.mountPoint } : undefined);
        return { mounted: true, mountPoint: value.mountPoint ?? '/' } as TOut;
      }
      case 'runCommand': {
        const value = input as { command: string; args?: string[]; cwd?: string; env?: Env };
        return await collect(await c.spawn(value.command, value.args ?? [], { cwd: value.cwd, env: value.env })) as TOut;
      }
      default:
        throw new Error(`Unsupported WebContainer operation: ${operation}`);
    }
  },
};

export const CodeValidationServiceFacade = {
  execute: async <TIn = unknown, TOut = unknown>(operation: string, input?: TIn): Promise<TOut> => {
    if (operation !== 'validate') throw new Error(`Unsupported validation operation: ${operation}`);
    const value = input as { layers?: Array<'syntax' | 'lint' | 'test' | 'build'>; cwd?: string };
    const layers = value.layers?.length ? value.layers : ['syntax', 'lint', 'test', 'build'];
    const commands: Record<string, { command: string; args: string[] }> = {
      syntax: { command: 'pnpm', args: ['exec', 'tsc', '--noEmit'] },
      lint: { command: 'pnpm', args: ['run', 'lint', '--if-present'] },
      test: { command: 'pnpm', args: ['run', 'test', '--if-present'] },
      build: { command: 'pnpm', args: ['run', 'build', '--if-present'] },
    };
    const diagnostics: Array<{ layer: string; ok: boolean; exitCode: number; command: string; output: string }> = [];
    for (const layer of layers) {
      const spec = commands[layer];
      const result = await WebContainerServiceFacade.execute<{ command: string; args: string[]; cwd?: string }, Result>('runCommand', {
        command: spec.command,
        args: spec.args,
        cwd: value.cwd,
      });
      diagnostics.push({ layer, ok: result.exitCode === 0, exitCode: result.exitCode, command: [spec.command, ...spec.args].join(' '), output: result.output });
      if (result.exitCode !== 0) break;
    }
    return {
      ok: diagnostics.every(item => item.ok),
      diagnostics,
      failedLayers: diagnostics.filter(item => !item.ok).map(item => item.layer),
    } as TOut;
  },
};
