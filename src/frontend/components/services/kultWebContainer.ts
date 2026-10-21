import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import type { GeneratedExecutionProject } from './kultExecutionModel';
import { parseExecutionResult } from './kultExecutionModel';

export interface WebContainerRunResult {
  installExitCode: number;
  exitCode: number;
  output: string;
  result: ReturnType<typeof parseExecutionResult>;
}

let instancePromise: Promise<WebContainer> | null = null;

async function getInstance(): Promise<WebContainer> {
  if (!instancePromise) {
    instancePromise = WebContainer.boot();
  }
  return instancePromise;
}

function toFileSystemTree(files: GeneratedExecutionProject['files']): FileSystemTree {
  return files as FileSystemTree;
}

async function collectOutput(process: Awaited<ReturnType<WebContainer['spawn']>>): Promise<string> {
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
  return output;
}

export async function runInWebContainer(
  project: GeneratedExecutionProject,
  input: Record<string, unknown>,
  targetIndex: number,
  options: { mode?: 'functionality' | 'service'; orchestrationIds?: string[] } = {},
): Promise<WebContainerRunResult> {
  const container = await getInstance();
  await container.mount(toFileSystemTree(project.files));

  const install = await container.spawn('npm', ['install', '--no-audit', '--no-fund']);
  const installOutputPromise = collectOutput(install);
  const installExitCode = await install.exit;
  const installOutput = await installOutputPromise;
  if (installExitCode !== 0) {
    return {
      installExitCode,
      exitCode: installExitCode,
      output: installOutput,
      result: { ok: false, error: 'Dependency installation failed.\\n' + installOutput },
    };
  }

  const run = await container.spawn(project.command[0], project.command.slice(1), {
    env: {
      KULT_TEST_INPUT: JSON.stringify(input),
      KULT_TARGET: String(targetIndex),
      KULT_TEST_MODE: options.mode || 'functionality',
      KULT_ORCHESTRATION_IDS: JSON.stringify(options.orchestrationIds || []),
    },
  });
  const outputPromise = collectOutput(run);
  const exitCode = await run.exit;
  const output = await outputPromise;

  return {
    installExitCode,
    exitCode,
    output,
    result: parseExecutionResult(output),
  };
}

export async function disposeWebContainer(): Promise<void> {
  if (!instancePromise) return;
  const container = await instancePromise;
  container.teardown();
  instancePromise = null;
}
