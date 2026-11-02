import {
  DevelopmentRuntime,
  GitHubActionsClient,
  WebContainerRuntime,
  type DevelopmentRequest,
  type DevelopmentResult,
} from '@ultrst-armada/kloks/development';

export function createKultDevelopmentRuntime(githubToken?: string) {
  return new DevelopmentRuntime(
    new WebContainerRuntime(),
    githubToken ? new GitHubActionsClient({ token: githubToken }) : undefined,
  );
}

export async function runKultDevelopment(
  request: DevelopmentRequest,
  githubToken?: string,
): Promise<DevelopmentResult> {
  return createKultDevelopmentRuntime(githubToken).run(request);
}

export interface KultBrowserInspectionRequest {
  url: string;
  timeoutMs?: number;
  viewports?: Array<{ width: number; height: number }>;
  screenshotDirectory?: string;
  reportPath?: string;
  captureDom?: boolean;
}

export interface KultBrowserInspectionAdapter {
  inspect(request: KultBrowserInspectionRequest): Promise<{
    ok: boolean;
    errors: Array<{ kind: string; message: string }>;
    logs: Array<{ type: string; message: string; url?: string; line?: number; column?: number }>;
    screenshots: string[];
    reportPath?: string;
    title?: string;
    status?: number;
    domSnapshot?: string;
    checks?: Array<{ selector: string; passed: boolean; details?: string }>;
  }>;
}

async function resolveKultInspector(adapter?: KultBrowserInspectionAdapter): Promise<KultBrowserInspectionAdapter> {
  if (adapter) return adapter;
  if (typeof window !== 'undefined') throw new Error('Playwright inspection must run in a Node.js engineering process.');
  try {
    const entry = '@ultrst-armada/kloks/browser-inspection';
    const module = await import(entry) as unknown as { PlaywrightInspectionRuntime: new () => KultBrowserInspectionAdapter };
    return new module.PlaywrightInspectionRuntime();
  } catch {
    throw new Error('Kloks browser-inspection is unavailable. Publish/install the shared inspector before running service UI inspection.');
  }
}

export function createKultBrowserInspection(adapter?: KultBrowserInspectionAdapter) {
  return {
    inspectServiceUI: async (request: KultBrowserInspectionRequest) =>
      (await resolveKultInspector(adapter)).inspect(request),
  };
}
