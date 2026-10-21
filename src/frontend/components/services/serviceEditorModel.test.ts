import test from "node:test";
import assert from "node:assert/strict";
import { validateServiceEditor } from "./serviceEditorModel";

const base = {
  name: "AuthenticationService",
  version: "0.1.0",
  folder: "services/authentication-service",
  libraries: ["@ultrst-armada/gutts"],
  functionalities: [
    { id: "a", name: "createUser", description: "", inputSignature: "CreateUserInput", outputSignature: "User", tags: [] },
    { id: "b", name: "sendWelcomeEmail", description: "", inputSignature: "EmailInput", outputSignature: "EmailResult", tags: [] },
  ],
  orchestrations: [{ id: "o", name: "register", description: "", functionalityIds: ["a", "b"] }],
};

test("valid service editor state passes", () => assert.equal(validateServiceEditor(base).isValid, true));
test("invalid semantic version is rejected", () => assert.match(validateServiceEditor({ ...base, version: "latest" }).errors.join("\n"), /semantic version/));
test("duplicate functionality names are rejected", () => assert.match(validateServiceEditor({ ...base, functionalities: [base.functionalities[0], { ...base.functionalities[1], name: "createUser" }] }).errors.join("\n"), /Duplicate functionality/));
test("orchestration with fewer than two functions is rejected", () => assert.match(validateServiceEditor({ ...base, orchestrations: [{ ...base.orchestrations[0], functionalityIds: ["a"] }] }).errors.join("\n"), /at least two/));
test("unknown orchestration references are rejected", () => assert.match(validateServiceEditor({ ...base, orchestrations: [{ ...base.orchestrations[0], functionalityIds: ["a", "missing"] }] }).errors.join("\n"), /unknown functionality/));
