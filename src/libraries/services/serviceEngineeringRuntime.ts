const builtin = (name: string): any => {
  const get = (globalThis as any).process?.getBuiltinModule;
  if (typeof get !== 'function') throw new Error('NODE_RUNTIME_REQUIRED');
  return get(name);
};

const fs = () => builtin('node:fs/promises');
const path = () => builtin('node:path');
const os = () => builtin('node:os');
const child = () => builtin('node:child_process');
const util = () => builtin('node:util');

export interface ArtifactFile { path: string; content: string; }
export interface CommandResult {
  command: string;
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface EngineeringResult {
  ok: boolean;
  commands: CommandResult[];
  error?: string;
}

const COMMANDS: Record<string, [string, string[]]> = {
  lint: ['pnpm', ['run', 'lint']],
  typecheck: ['pnpm', ['exec', 'tsc', '--noEmit']],
  test: ['pnpm', ['test', '--', '--run']],
};

export async function runArtifactEngineering(
  files: ArtifactFile[],
  timeoutMs = 120_000,
): Promise<EngineeringResult> {
  const root = await fs().mkdtemp(path().join(os().tmpdir(), 'kult-service-'));
  const results: CommandResult[] = [];
  try {
    for (const file of files) {
      const target = path().join(root, file.path);
      await fs().mkdir(path().dirname(target), { recursive: true });
      await fs().writeFile(target, file.content, 'utf8');
    }
    if (!files.some((file) => file.path === 'package.json')) {
      throw new Error('ARTIFACT_MISSING_PACKAGE_JSON');
    }

    await runCommand('install', 'pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], root, timeoutMs, results);
    if (!results.at(-1)?.ok) return { ok: false, commands: results };

    for (const [name, [bin, args]] of Object.entries(COMMANDS)) {
      await runCommand(name, bin, args, root, timeoutMs, results);
      if (!results.at(-1)?.ok) return { ok: false, commands: results };
    }
    return { ok: true, commands: results };
  } catch (error) {
    return { ok: false, commands: results, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await fs().rm(root, { recursive: true, force: true });
  }
}

async function runCommand(
  _name: string,
  bin: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  output: CommandResult[],
) {
  const started = Date.now();
  try {
    const execFile = util().promisify(child().execFile);
    const result = await execFile(bin, args, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
    });
    output.push({
      command: bin + ' ' + args.join(' '),
      ok: true,
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: Date.now() - started,
    });
  } catch (error: any) {
    output.push({
      command: bin + ' ' + args.join(' '),
      ok: false,
      exitCode: typeof error?.code === 'number' ? error.code : 1,
      stdout: error?.stdout || '',
      stderr: error?.stderr || error?.message || String(error),
      durationMs: Date.now() - started,
    });
  }
}
