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
    screenshots: string[];
  }>;
}

export function createKultBrowserInspection(adapter: KultBrowserInspectionAdapter) {
  return {
    inspectServiceUI: (request: KultBrowserInspectionRequest) => adapter.inspect(request),
  };
}
