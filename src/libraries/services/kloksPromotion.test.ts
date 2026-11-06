import assert from "node:assert/strict";
import test from "node:test";
import { STARTER_KLOKS_ARITHMETIC_SERVICE } from "./starterServices.js";
import { promoteKultServiceToKloks } from "./kloksPromotion.js";

const makeGitHub = (files: Map<string, { content: string; sha: string }>) => {
  const commits: Array<{ path: string; content: string }> = [];
  return {
    commits,
    client: {
      getFile: async (_account: string, _repo: string, path: string) => files.get(path) || null,
      commitFile: async (_account: string, _repo: string, path: string, content: string) => {
        commits.push({ path, content });
        files.set(path, { content: btoa(content), sha: "sha-" + commits.length });
        return { commitSha: "commit-" + commits.length };
      },
      dispatchWorkflow: async () => {},
      pollWorkflow: async () => ({ id: 9, status: "completed", conclusion: "success" as const }),
    },
  };
};

test("promotion validates, inserts files, updates exports and bumps version", async () => {
  const files = new Map<string, { content: string; sha: string }>([
    ["packages/services/package.json", { content: btoa(JSON.stringify({ name: "@ultrst-armada/kloks", version: "1.24.0" })), sha: "pkg-sha" }],
    ["packages/services/src/index.ts", { content: btoa("export * from './existing.js';\n"), sha: "index-sha" }],
  ]);
  const fake = makeGitHub(files);
  const result = await promoteKultServiceToKloks(STARTER_KLOKS_ARITHMETIC_SERVICE, {
    account: "primary", repository: "dinilmusick/Kloks", branch: "main", workflow: "ci.yml",
    servicePath: "packages/services/src/generated/arithmetic", exportPath: "packages/services/src/index.ts",
    exportStatement: "export * from './generated/arithmetic/index.js';",
    packageJsonPath: "packages/services/package.json", npmPackageName: "@ultrst-armada/kloks",
  }, fake.client, {
    engineer: async () => ({ ok: true, commands: [] }),
    fetchImpl: async () => new Response(JSON.stringify({ versions: { "1.25.0": {} } }), { status: 200 }),
  });
  assert.equal(result.status, "published");
  assert.equal(result.version, "1.25.0");
  assert.equal(result.publication?.published, true);
  assert.equal(fake.commits.some(({ path }) => path.endsWith("/src/index.ts")), true);
  assert.equal(fake.commits.length > 2, true);
});

test("promotion blocks before mutation when validation fails", async () => {
  const invalid = structuredClone(STARTER_KLOKS_ARITHMETIC_SERVICE);
  invalid.service.name = "";
  let commits = 0;
  const result = await promoteKultServiceToKloks(invalid, {
    account: "primary", repository: "repo", branch: "main", workflow: "ci.yml",
    servicePath: "generated/service", exportPath: "src/index.ts", exportStatement: "export * from './generated/service/index.js';",
    packageJsonPath: "package.json", npmPackageName: "@example/service",
  }, {
    getFile: async () => ({ content: btoa(JSON.stringify({ version: "1.24.0" })), sha: "sha" }),
    commitFile: async () => { commits++; return { commitSha: "never" }; },
    dispatchWorkflow: async () => {},
    pollWorkflow: async () => ({ id: 1, status: "completed", conclusion: "success" as const }),
  }, { engineer: async () => ({ ok: true, commands: [] }) });
  assert.equal(result.status, "blocked");
  assert.equal(commits, 0);
});
