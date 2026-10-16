# KULT ENGINE — IMPLEMENTATION SPECIFICATION

STATUS := CANONICAL
AUTHORITY := KULT-ENGINE repository
ROLE := visual KRNLTS service authoring / testing / promotion workspace

## 0. PURPOSE

KULT := visual authoring environment for KRNLTS backend services.

KULT MUST let an author:
1. discover/reuse KRNLTS + KLOKS assets;
2. compose service logic as a typed node graph;
3. inspect every input/output contract visually;
4. execute the graph with supplied test inputs;
5. display intermediate/final results and failures on the graph;
6. construct and bind a UI schema to service inputs, outputs, state and actions;
7. validate the resulting service against KRNLTS contracts;
8. export/promote the service into KLOKS as a real package/service artifact;
9. reopen existing KLOKS services, inspect their graph representation where possible, edit them, test them, and export an updated artifact.

KULT is an AUTHORING TOOL. It is not:
- the KRNLTS runtime/framework;
- a replacement for KRNLTS validation semantics;
- the KLOKS package/runtime layer;
- SKIPO application governance;
- FLOKS;
- KRUSBL/CRUCIBLE ecosystem orchestration.

## 1. VERIFIED ECOSYSTEM BOUNDARY

Authoritative repositories inspected:
- `dinilmusick/KrnlTS`
- `dinilmusick/Kloks`
- `dinilmusick/Floks`
- `dinilmusick/Skipo`
- `dinilmusick/Kult-Engine`

Current contracts establish:

```
KRNLTS -> KLOKS -> SKIPO
React  -> FLOKS -> SKIPO
                     |
                  KULT consumes these layers
```

KRNLTS owns service runtime semantics, service contracts, composition primitives and validation.
KLOKS owns reusable backend service implementations, package exports, manifests and compatibility metadata.
SKIPO owns application composition/governance.
FLOKS owns reusable React components.

KULT therefore consumes existing contracts; it MUST NOT redefine them.

## 2. CURRENT KULT BASELINE

The current KULT repository is a very small SKIPO application scaffold.

Already available through the scaffold:
- React + TypeScript;
- React Flow dependency;
- Zustand node-graph state;
- authentication/workspace infrastructure;
- API client boundary;
- BullMQ/in-memory command queue;
- Zod validation;
- backend facade;
- Cloudflare/Vercel build targets;
- SKIPO validation/governance.

The existing scaffold documentation explicitly identifies the React Flow node graph and Zustand node graph store as reusable infrastructure.

Current KULT application code is therefore mostly domain-empty. The implementation work is the KULT domain layer, not a replacement of scaffold infrastructure.

## 3. CORE ARCHITECTURE

```
                    KULT WORKSPACE
                         |
              +----------+----------+
              |                     |
        SERVICE GRAPH          UI SCHEMA GRAPH
              |                     |
              +----------+----------+
                         |
                    SERVICE IR
                         |
          +--------------+--------------+
          |              |              |
       VALIDATE       EXECUTE       EXPORT
          |              |              |
       KRNLTS         KRNLTS        KLOKS
       contracts      runtime       artifact
```

The graph is an editor representation.
SERVICE_IR is the canonical persisted representation.
Runtime execution MUST compile/use SERVICE_IR through a KRNLTS-compatible adapter.
KLOKS export MUST be generated from SERVICE_IR and package metadata.

Do not make React Flow node objects the service contract.

## 4. SERVICE IR

Define a serializable, versioned intermediate representation.

```ts
ServiceDocument := {
  schemaVersion,
  service: {
    id,
    name,
    version,
    description,
    entryNodeId,
    inputPorts,
    outputPorts
  },
  nodes: NodeSpec[],
  edges: EdgeSpec[],
  uiSchema?: UISchema,
  assets: AssetRef[],
  tests: ServiceTestCase[],
  metadata
}
```

### NodeSpec

```ts
NodeSpec := {
  id,
  kind,
  type,
  version,
  position,
  config,
  inputs,
  outputs,
  metadata
}
```

### EdgeSpec

```ts
EdgeSpec := {
  id,
  sourceNodeId,
  sourcePort,
  targetNodeId,
  targetPort,
  transform?
}
```

Every graph port has:
- stable id;
- direction;
- value type;
- optional schema;
- cardinality;
- nullability;
- execution/data classification.

Graph topology MUST be independently serializable and deterministic.

## 5. NODE TAXONOMY

Implement node kinds as adapters over real KRNLTS/KLOKS concepts.

Initial kinds:

### 5.1 Input / Output
- ServiceInput
- ServiceOutput
- Constant
- Parameter
- Environment/secret reference

### 5.2 Pure Function
- KRNLTS function/library function
- transform
- validation
- mapping

### 5.3 Entity / State
- entity read
- entity write
- state read
- state write

### 5.4 Service / Facade
- existing KLOKS service
- KRNLTS service/facade
- nested workflow/orchestration

### 5.5 Control
- conditional
- branch
- merge
- loop/collection
- error boundary
- result/return

### 5.6 Protocol / Event
Only where supported by actual KRNLTS contracts:
- HTTP ingress
- WebSocket ingress
- RPC/MCP binding
- event input/output

KULT MUST NOT invent unsupported runtime semantics. Unsupported node kinds remain unavailable until a corresponding KRNLTS/KLOKS contract exists.

## 6. TYPED PORT / WIRE SYSTEM

The graph editor MUST enforce contracts before execution.

Compatibility is determined from actual type/schema metadata, not node labels.

```
connect(A.out, B.in)
  -> resolve public contract
  -> normalize type/schema
  -> compatibility check
  -> accept | reject with reason
```

Support:
- primitive types;
- object schemas;
- arrays;
- nullable values;
- discriminated unions where supported;
- explicit adapters/transforms.

Visual wire states:
- valid;
- invalid;
- unresolved;
- runtime-error;
- selected/debug.

Do not silently coerce incompatible values.

## 7. KRNLTS CONTRACT DISCOVERY

Build a KULT discovery adapter.

Sources, in order:
1. installed/local KRNLTS package metadata;
2. installed/local KLOKS package metadata;
3. repository/package manifests;
4. generated declarations/public exports;
5. explicit KULT asset metadata.

Discovery output MUST include:
- symbol/service id;
- package;
- version;
- public export path;
- callable signature;
- input schema;
- output schema;
- error contract;
- capability metadata;
- source/version provenance.

KULT consumes these contracts. It does not become their authority.

## 8. KLOKS ASSET BROWSER

Implement a library browser for the existing KLOKS package model.

Current KLOKS catalog areas include:
- functions
- state-graph
- audio-midi
- services
- backend
- orchestrations
- contracts

The browser MUST support:
- search;
- package/category filtering;
- symbol/service inspection;
- version/provenance display;
- drag/drop or insert-to-graph;
- dependency visibility;
- reuse of existing assets.

The same discovery model must work for editing existing KLOKS services.

## 9. GRAPH EDITOR

Use the already-provided React Flow infrastructure and Zustand graph store.

Required interactions:
- add/remove node;
- connect/disconnect ports;
- move/group/select;
- copy/paste;
- undo/redo;
- zoom/pan;
- fit/focus;
- multi-select;
- node configuration;
- port inspection;
- graph validation markers.

Do not replace the SKIPO node-graph substrate with a second graph implementation.

### Visual structure

```
[INPUT] --> [VALIDATE] --> [FUNCTION] --> [SERVICE] --> [OUTPUT]
               |               |              |
               +------------ debug ----------+
```

Execution/data ports MUST be visually distinct from configuration metadata.

## 10. NODE INSPECTOR

Selecting a node opens its contract/configuration inspector.

Show:
- identity;
- package/source;
- version;
- inputs;
- outputs;
- schema;
- configuration;
- errors;
- dependencies;
- documentation;
- test/debug values.

Editing a node MUST update SERVICE_IR through typed validation.

## 11. GRAPH VALIDATION

Validation occurs continuously and before execution/export.

Validation layers:

1. graph topology;
2. port compatibility;
3. required configuration;
4. schema validity;
5. unresolved references;
6. dependency closure;
7. KRNLTS contract validation;
8. purity/architecture constraints where applicable;
9. export/package validity.

Represent errors at the exact node/edge/port where possible.

No export is allowed with blocking validation errors.

## 12. EXECUTION / DEBUGGER

KULT needs a real execution path, not a mock visual simulation.

```
TestInput
   |
compile/resolve SERVICE_IR
   |
KRNLTS-compatible execution adapter
   |
execution trace
   |
graph overlay + result panel
```

Each run produces:

```
ExecutionRun := {
  runId,
  serviceRevision,
  startedAt,
  status,
  input,
  nodeResults[],
  logs[],
  errors[],
  output,
  duration
}
```

Each node result contains:
- status;
- input values;
- output values;
- duration;
- error;
- execution order;
- timestamp.

Graph overlay:
- pending;
- running;
- passed;
- failed;
- skipped.

Clicking a node after execution shows its captured values.

Execution MUST use the same service semantics as export/runtime. Do not implement a second incompatible evaluator merely for previews.

## 13. TEST CASE SYSTEM

Tests are first-class SERVICE_IR data.

```
ServiceTestCase := {
  id,
  name,
  input,
  expectedOutput?,
  expectedError?,
  assertions[],
  enabled
}
```

Support:
- create/edit/delete test;
- run one test;
- run all tests;
- assertion results;
- node-level trace;
- regression history for the current workspace revision.

Test inputs MUST be bindable to service input ports.

Results MUST appear both:
- on the graph;
- in a structured test panel.

## 14. LIVE INPUT / OUTPUT PROBES

Every exposed service input/output must support a test probe.

Input probe:
```
InputPort -> TestValue -> execution
```

Output probe:
```
execution -> OutputValue -> inspector
```

Intermediate node ports should optionally expose sampled runtime values.

Probes MUST NOT mutate the service definition.

## 15. UI SCHEMA AUTHORING

KULT must author a UI schema alongside the backend service.

UI schema is metadata/configuration, not React source code.

```
UISchema := {
  version,
  surfaces: SurfaceSpec[],
  bindings: BindingSpec[],
  actions: ActionSpec[]
}
```

Surface primitives should cover at minimum:
- form;
- field;
- text;
- number;
- boolean;
- select;
- collection;
- result;
- error;
- action.

Each field/action binds to a typed service port or service operation.

Example:

```
UI field "frequency"
    -> service input "frequency"

UI action "Run"
    -> service entry invocation

UI result
    <- service output "result"
```

Bindings MUST be validated against SERVICE_IR.

KULT should render a live preview from the UI schema using existing FLOKS-compatible React primitives where practical, but KULT remains the authoring layer and does not become FLOKS.

## 16. UI <-> SERVICE BINDING

Bindings support:
- input value -> service input;
- service output -> displayed value;
- service error -> error surface;
- action -> service invocation;
- loading/running state -> UI state;
- collection output -> collection view.

Invalid bindings are blocking export errors.

## 17. SERVICE DOCUMENT PERSISTENCE

Workspace persistence MUST store:
- SERVICE_IR;
- UI schema;
- tests;
- graph layout;
- asset references;
- package provenance;
- revision metadata.

Use existing SKIPO workspace/storage infrastructure.

Do not create a second workspace/account system.

Graph layout is editor metadata and MUST NOT affect service semantics.

## 18. EXISTING KLOKS SERVICE IMPORT

Implement import adapters for existing KLOKS services.

Import process:

```
KLOKS package
 -> resolve package/version
 -> inspect public exports
 -> locate service/facade manifest
 -> load implementation metadata/graph metadata where available
 -> construct SERVICE_IR
 -> preserve source provenance
 -> open in editor
```

Important limitation:
arbitrary existing TypeScript cannot always be losslessly reconstructed into a visual graph.

Therefore define two representations:

1. GRAPH_NATIVE
   - authored/exported by KULT;
   - lossless graph round-trip.

2. CODE_IMPORTED
   - existing KLOKS service represented through a service/facade boundary;
   - inspectable and callable;
   - internal implementation is not falsely represented as editable graph nodes unless source metadata proves the mapping.

For CODE_IMPORTED services, KULT may wrap the existing service as a node and allow replacement/refactoring around that boundary.

## 19. KLOKS EXPORT

Export MUST generate a real KLOKS-compatible artifact.

```
SERVICE_IR
   |
validate
   |
resolve dependencies
   |
generate source + types + exports + manifest + tests
   |
KLOKS package artifact
```

Generated artifact must preserve:
- public service identity;
- typed inputs/outputs;
- dependency declarations;
- exports;
- KLOKS manifest requirements;
- tests;
- KRNLTS compatibility.

Export targets:
- create new KLOKS service/package;
- update an existing KLOKS service/package;
- local preview/export;
- repository promotion.

KULT MUST NOT silently write arbitrary files into KLOKS. Use an explicit promotion operation with a preview/diff.

## 20. KLOKS PROMOTION WORKFLOW

Promotion flow:

```
KULT graph
 -> validate
 -> generate
 -> package diff
 -> user review
 -> promotion request
 -> KLOKS branch/change set
 -> KLOKS validation
 -> merge/publish according to repository policy
```

The KULT implementation must keep repository mutation behind a backend facade.

Never embed GitHub credentials or direct repository mutation inside React components.

## 21. VERSION / PROVENANCE

Every reusable asset reference records:

```
AssetRef := {
  package,
  export,
  version,
  source,
  contractFingerprint
}
```

A service revision records the exact asset versions used.

When an asset changes:
- detect contract drift;
- mark affected nodes;
- revalidate;
- never silently substitute a new incompatible version.

## 22. DEPENDENCY CLOSURE

Before export:

```
Graph dependencies
  -> asset dependencies
  -> package dependencies
  -> KRNLTS dependency
  -> complete resolvable closure
```

Report:
- direct dependencies;
- transitive dependencies;
- unresolved dependencies;
- duplicate/conflicting versions.

KULT must not become a package manager.

## 23. BACKEND COMMAND BOUNDARY

Use the existing API client + backend facade + queue for expensive operations.

Commands should include conceptually:
- DISCOVER_ASSETS
- LOAD_SERVICE
- VALIDATE_SERVICE
- RUN_SERVICE_TEST
- RUN_SERVICE_TEST_SUITE
- GENERATE_SERVICE_ARTIFACT
- PREVIEW_KLOKS_EXPORT
- PROMOTE_KLOKS_CHANGE
- CHECK_PROMOTION_STATUS

Exact command names may be adjusted to existing KULT command conventions.

Long-running generation, validation, tests and promotion use the existing queue infrastructure where appropriate.

## 24. SECURITY

- workspace-scoped repository/provider credentials only;
- no credentials in SERVICE_IR;
- secrets are references, never serialized values;
- service graph must distinguish public configuration from secret references;
- promotion operations require explicit user action;
- backend validates workspace ownership and operation permissions.

Use the scaffold's existing authentication/workspace/security mechanisms.

## 25. UI ARCHITECTURE

Primary workspace layout:

```
+---------------------------------------------------------------+
| Top toolbar: Service | Run | Validate | Tests | Export        |
+----------------+--------------------------------+-------------+
| Asset Library  |                                | Inspector   |
| KLOKS/KRNLTS   |          GRAPH CANVAS          | Node/Port   |
| search/filter  |                                | Config      |
+----------------+--------------------------------+-------------+
| Test / Output / Execution Trace / UI Preview                 |
+---------------------------------------------------------------+
```

Panels should be dockable/collapsible using existing SKIPO UI primitives.

The graph remains the central authoring surface.

## 26. STATE MODEL

Zustand remains the frontend state authority.

Separate stores/slices for:
- workspace/session;
- service document;
- graph editor state;
- asset catalog;
- execution/debug state;
- test cases;
- UI schema;
- inspector;
- promotion/export state.

Do not create parallel global state systems.

## 27. FILE / MODULE RULES

Follow existing SKIPO/KULT governance:
- focused modules;
- <=200 lines for code files;
- no stubs;
- no raw UI primitives when SKIPO equivalents exist;
- design tokens only;
- no direct network calls from React;
- no duplicated infrastructure already supplied by the scaffold.

Prefer adapters/facades over cross-layer imports.

## 28. IMPLEMENTATION PHASES

### PHASE 0 — Contract Freeze
- confirm current KrnlTS public service/runtime contracts;
- confirm KLOKS package/manifest/export contracts;
- document KULT-owned SERVICE_IR;
- add schema versioning and validation.

EXIT:
- SERVICE_IR and ownership boundaries are tested.

### PHASE 1 — Asset Discovery
- KLOKS/KRNLTS discovery adapters;
- catalog/search/filter;
- contract metadata normalization;
- provenance/fingerprint support.

EXIT:
- real KLOKS assets appear as typed graph candidates.

### PHASE 2 — Graph Authoring Core
- node registry;
- typed ports;
- compatibility registry;
- graph persistence;
- node inspector;
- validation overlays.

EXIT:
- a typed service graph can be authored and round-tripped losslessly.

### PHASE 3 — KRNLTS Execution
- SERVICE_IR compiler/adapter;
- test input injection;
- execution trace;
- node result capture;
- graph debug overlays;
- error propagation.

EXIT:
- real service execution and test results are visible on the graph.

### PHASE 4 — Test System
- test case CRUD;
- assertions;
- single/all test execution;
- regression result history.

EXIT:
- service behavior can be regression-tested entirely inside KULT.

### PHASE 5 — UI Schema Builder
- UI schema IR;
- field/action primitives;
- typed bindings;
- live preview;
- validation.

EXIT:
- a service and its UI can be constructed/tested from the same workspace.

### PHASE 6 — KLOKS Import
- package/service loader;
- GRAPH_NATIVE import;
- CODE_IMPORTED wrapper mode;
- provenance preservation.

EXIT:
- existing KLOKS services can be reopened without pretending arbitrary code is graph-native.

### PHASE 7 — KLOKS Export
- source generator;
- package/manifest generator;
- test generation;
- dependency closure;
- diff preview.

EXIT:
- KULT produces a valid KLOKS artifact with deterministic output.

### PHASE 8 — Promotion
- backend promotion facade;
- branch/change-set creation;
- validation status;
- explicit review/approval;
- promotion result tracking.

EXIT:
- user can move an approved service from KULT into KLOKS through a controlled workflow.

### PHASE 9 — Hardening
- contract tests;
- round-trip tests;
- execution parity tests;
- import/export fixtures;
- security tests;
- large graph tests;
- validator integration;
- build/typecheck/test gates.

EXIT:
```
build
AND typecheck
AND tests
AND KULT validation
AND KRNLTS contract validation
AND KLOKS artifact validation
AND no ownership leakage
```

## 29. TEST MATRIX

### Unit
- SERVICE_IR schemas;
- node registry;
- port compatibility;
- binding validation;
- asset normalization;
- dependency closure;
- source generation.

### Graph
- topology editing;
- serialization;
- round-trip;
- undo/redo;
- invalid wire rejection.

### Execution
- input injection;
- deterministic functions;
- service/facade calls;
- errors;
- cancellation/timeouts;
- trace capture.

### UI Schema
- valid bindings;
- invalid bindings;
- required fields;
- output rendering;
- action invocation.

### KLOKS
- import fixtures;
- export fixtures;
- manifest correctness;
- public exports;
- dependency closure;
- contract fingerprints.

### End-to-End
```
discover -> compose -> validate -> test -> UI-bind
       -> preview -> export -> KLOKS validation
```

## 30. NON-GOALS

Do NOT implement:
- a new backend runtime;
- a new service framework;
- a second node-graph engine;
- a second global state system;
- a replacement package manager;
- FLOKS as a separate framework;
- SKIPO governance replacement;
- KRUSBL/CRUCIBLE ecosystem orchestration;
- arbitrary TypeScript-to-graph decompilation presented as lossless.

## 31. DEFINITION OF DONE

KULT is complete for the first production milestone when an author can:

```
OPEN WORKSPACE
  -> discover KLOKS/KRNLTS assets
  -> drag typed functionality into graph
  -> connect compatible ports
  -> configure service
  -> attach test inputs
  -> run service
  -> inspect node-by-node results
  -> construct UI schema
  -> bind UI to service
  -> run tests
  -> inspect failures on graph
  -> preview generated KLOKS artifact
  -> review diff
  -> promote to KLOKS
  -> reopen the resulting service
```

All operations use the existing SKIPO/KRNLTS/KLOKS contracts rather than duplicating their responsibilities.
