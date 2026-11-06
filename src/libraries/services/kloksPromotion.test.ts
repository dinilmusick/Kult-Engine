import assert from "node:assert/strict";
import test from "node:test";
import { STARTER_KLOKS_ARITHMETIC_SERVICE } from "./starterServices.js";
import { promoteKultServiceToKloks, type PromotionGitHubClient } from "./kloksPromotion.js";

const makeGitHub = (files: Map<string, { content: string; sha: string }>) => {
  const commits: Array<{ path: string; content: string }> = [];
  const client: PromotionGitHubClient = {
    getFile: async (_account, _repo, path) => files.get(path) || null,
    commitFile: async (_account, _repo, path, content) => {
      commits.push({ path, content });
      files.set(path, { content: btoa(content), sha: "sha-" + commits.length });
      return { commitSha: "commit-" + commits.length };
    },
    dispatchWorkflow: async () => {},
    pollWorkflow: async () => ({ id: 9, status: "completed", conclusion: "success" }),
  };
  return { commits, client };
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

test("promotion supports dry-run without mutation", async () => {
  const fake = makeGitHub(new Map([
    ["package.json", { content: btoa(JSON.stringify({ version: "1.24.0" })), sha: "pkg" }],
  ]));
  const result = await promoteKultServiceToKloks(STARTER_KLOKS_ARITHMETIC_SERVICE, {
    account: "primary", repository: "repo", branch: "main", workflow: "ci.yml",
    servicePath: "generated/service", exportPath: "src/index.ts", exportStatement: "export * from './generated/service/index.js';",
    packageJsonPath: "package.json", npmPackageName: "@example/service",
  }, fake.client, { engineer: async () => ({ ok: true, commands: [] }), dryRun: true });
  assert.equal(result.status, "dry_run");
  assert.equal(fake.commits.length, 0);
});

test("promotion reports CI failure without claiming publication", async () => {
  const fake = makeGitHub(new Map([
    ["package.json", { content: btoa(JSON.stringify({ version: "1.24.0" })), sha: "pkg" }],
  ]));
  fake.client.pollWorkflow = async () => ({ id: 10, status: "completed", conclusion: "failure" });
  const result = await promoteKultServiceToKloks(STARTER_KLOKS_ARITHMETIC_SERVICE, {
    account: "primary", repository: "repo", branch: "main", workflow: "ci.yml",
    servicePath: "generated/service", exportPath: "src/index.ts", exportStatement: "export * from './generated/service/index.js';",
    packageJsonPath: "package.json", npmPackageName: "@example/service",
  }, fake.client, { engineer: async () => ({ ok: true, commands: [] }) });
  assert.equal(result.status, "ci_failed");
  assert.equal(result.publication, undefined);
});

test("promotion is idempotent after the first successful promotion", async () => {
  const fake = makeGitHub(new Map([
    ["package.json", { content: btoa(JSON.stringify({ version: "1.24.0" })), sha: "pkg" }],
  ]));
  const target = {
    account: "primary", repository: "repo", branch: "main", workflow: "ci.yml",
    servicePath: "generated/service", exportPath: "src/index.ts", exportStatement: "export * from './generated/service/index.js';",
    packageJsonPath: "package.json", npmPackageName: "@example/service",
  };
  const options = {
    engineer: async () => ({ ok: true, commands: [] }),
    fetchImpl: async () => new Response(JSON.stringify({ versions: { "1.25.0": {} } }), { status: 200 }),
  };
  const first = await promoteKultServiceToKloks(STARTER_KLOKS_ARITHMETIC_SERVICE, target, fake.client, options);
  assert.equal(first.status, "published");
  const commitCount = fake.commits.length;
  const second = await promoteKultServiceToKloks(STARTER_KLOKS_ARITHMETIC_SERVICE, target, fake.client, options);
  assert.equal(second.status, "noop");
  assert.equal(fake.commits.length, commitCount);
});
