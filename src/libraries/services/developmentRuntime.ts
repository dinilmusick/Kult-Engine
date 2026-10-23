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
