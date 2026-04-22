# Monorepo Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-package repo into a pnpm workspace with the library at `packages/content-layer/`, keeping CI and the published package functionally equivalent to today.

**Architecture:** Workspace root owns cross-cutting concerns (fmt, lint, pnpm config, shared tooling devDependencies). The library package owns its own build, test, and publish metadata. `examples/*` is pre-declared in the workspace manifest but unused for now.

**Tech Stack:** Vite+ (`vp` CLI), pnpm 10.33.0 workspaces, TypeScript.

**Spec:** [`docs/superpowers/specs/2026-04-22-monorepo-restructure-design.md`](../specs/2026-04-22-monorepo-restructure-design.md)

---

### Task 1: Create the workspace package layout

**Files:**

- Create: `pnpm-workspace.yaml`
- Move: `src/` → `packages/content-layer/src/`
- Create: `packages/content-layer/package.json`
- Create: `packages/content-layer/tsconfig.json`
- Create: `packages/content-layer/vite.config.ts`

- [ ] **Step 1: Create the workspace manifest**

Create `pnpm-workspace.yaml`:

```yaml
packages:
    - packages/*
    - examples/*
```

- [ ] **Step 2: Move library source into the package**

Use `git mv` so history is preserved:

```bash
mkdir -p packages/content-layer
git mv src packages/content-layer/src
```

Expected: `git status` shows renames from `src/<file>` → `packages/content-layer/src/<file>` for every file in `src/`.

- [ ] **Step 3: Create the package `package.json`**

This is the current root `package.json` with three removals:

- `packageManager` (moves to workspace root)
- `pnpm.overrides` (moves to workspace root)
- The Vite+ tooling `devDependencies` — `@types/node`, `@typescript/native-preview`, `vite`, `vite-plus`, `vitest` (move to workspace root)

Create `packages/content-layer/package.json`:

```json
{
    "name": "@withsprinkles/content-layer",
    "version": "0.1.0",
    "description": "Load, validate, and query local or remote content as typed data in JSX apps.",
    "homepage": "https://github.com/withsprinkles/content-layer#readme",
    "bugs": {
        "url": "https://github.com/withsprinkles/content-layer/issues"
    },
    "license": "MIT",
    "author": "Mark Malstrom <mark@malstrom.me>",
    "repository": {
        "type": "git",
        "url": "git+https://github.com/withsprinkles/content-layer.git"
    },
    "files": ["dist"],
    "type": "module",
    "types": "./dist/index.d.mts",
    "exports": {
        ".": {
            "types": "./dist/index.d.mts",
            "import": "./dist/index.mjs"
        },
        "./react": {
            "types": "./dist/react.d.mts",
            "import": "./dist/react.mjs"
        },
        "./remix": {
            "types": "./dist/remix.d.mts",
            "import": "./dist/remix.mjs"
        },
        "./loaders": {
            "types": "./dist/loaders.d.mts",
            "import": "./dist/loaders.mjs"
        },
        "./internal/runtime": {
            "types": "./dist/runtime.d.mts",
            "import": "./dist/runtime.mjs"
        },
        "./internal/store": {
            "types": "./dist/store.d.mts",
            "import": "./dist/store.mjs"
        }
    },
    "scripts": {
        "prepublishOnly": "vp run build"
    },
    "dependencies": {
        "@standard-schema/spec": "^1.0.0",
        "@std/jsonc": "jsr:^1.0.2",
        "@std/yaml": "jsr:^1.0.12",
        "github-slugger": "^2.0.0",
        "gray-matter": "^4.0.3"
    },
    "peerDependencies": {
        "vite": "*"
    }
}
```

- [ ] **Step 4: Create the package `tsconfig.json`**

Create `packages/content-layer/tsconfig.json`:

```json
{
    "extends": "../../tsconfig.json",
    "include": ["src"]
}
```

- [ ] **Step 5: Create the package `vite.config.ts`**

Create `packages/content-layer/vite.config.ts` — the `pack`, `test`, and package-level `run.tasks` blocks that were in the current root config:

```ts
import { defineConfig } from "vite-plus";

export default defineConfig({
    pack: [
        {
            entry: {
                index: "src/index.ts",
                react: "src/react.ts",
                remix: "src/remix.ts",
                loaders: "src/loaders/index.ts",
                runtime: "src/runtime.ts",
                store: "src/store.ts",
            },
            dts: { tsgo: true },
        },
    ],
    run: {
        tasks: {
            dev: { command: "vp pack --watch" },
            build: { command: "vp pack" },
        },
    },
    test: {
        include: ["**/*.test.ts"],
    },
});
```

---

### Task 2: Transform workspace root

**Files:**

- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Rewrite root `package.json` as the workspace shell**

Replace the root `package.json` with:

```json
{
    "private": true,
    "type": "module",
    "packageManager": "pnpm@10.33.0",
    "devDependencies": {
        "@types/node": "^25.3.5",
        "@typescript/native-preview": "latest",
        "vite": "npm:@voidzero-dev/vite-plus-core@latest",
        "vite-plus": "latest",
        "vitest": "npm:@voidzero-dev/vite-plus-test@latest"
    },
    "pnpm": {
        "overrides": {
            "vite": "npm:@voidzero-dev/vite-plus-core@latest",
            "vitest": "npm:@voidzero-dev/vite-plus-test@latest"
        }
    }
}
```

Note: no `name`, `version`, `description`, `license`, `author`, `exports`, `files`, `scripts`, `dependencies`, or `peerDependencies` — this file is never published.

- [ ] **Step 2: Rewrite root `vite.config.ts` with fmt + lint only**

Replace root `vite.config.ts` with:

```ts
import { defineConfig } from "vite-plus";

export default defineConfig({
    fmt: {
        ignorePatterns: ["dist/**"],
        tabWidth: 4,
        arrowParens: "avoid",
        sortImports: {
            groups: [
                "type-import",
                ["value-builtin", "value-external"],
                "type-internal",
                "value-internal",
                ["type-parent", "type-sibling", "type-index"],
                ["value-parent", "value-sibling", "value-index"],
                "unknown",
            ],
            partitionByComment: true,
        },
        overrides: [
            {
                files: ["**/*.jsonc"],
                options: {
                    trailingComma: "none",
                },
            },
            {
                files: ["**/.vscode/**"],
                options: {
                    trailingComma: "all",
                },
            },
        ],
    },
    lint: {
        ignorePatterns: ["dist/**"],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        rules: {
            "typescript/no-floating-promises": "allow",
            "typescript/unbound-method": "allow",
        },
    },
});
```

Same settings as before — just no `pack`, `test`, or `run.tasks` blocks.

- [ ] **Step 3: Update root `tsconfig.json`**

Drop `"include"` so this is a clean base. Replace `tsconfig.json` with:

```json
{
    "compilerOptions": {
        "target": "esnext",
        "lib": ["esnext"],
        "moduleDetection": "force",
        "module": "preserve",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "types": ["node"],
        "strict": true,
        "noUnusedLocals": true,
        "declaration": true,
        "allowImportingTsExtensions": true,
        "emitDeclarationOnly": true,
        "esModuleInterop": true,
        "isolatedModules": true,
        "verbatimModuleSyntax": true,
        "skipLibCheck": true
    }
}
```

---

### Task 3: Update CI workflow

**Files:**

- Modify: `.github/workflows/publish.yml`

- [ ] **Step 1: Update the publish workflow**

Replace `.github/workflows/publish.yml` with:

```yaml
name: Publish to npm

on:
    release:
        types: [published]

permissions:
    contents: read
    id-token: write

jobs:
    publish:
        runs-on: ubuntu-latest
        defaults:
            run:
                working-directory: packages/content-layer
        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Setup Vite+
              uses: voidzero-dev/setup-vp@v1
              with:
                  node-version: "24"
                  cache: true

            - name: Install
              run: vp install --frozen-lockfile

            - name: Run tests
              run: vp test

            - name: Build package
              run: vp run build

            - name: Publish to npm with provenance
              run: npm publish --provenance --access public --tag latest
```

Changes vs the current workflow:

1. Job-level `defaults.run.working-directory: packages/content-layer` so every `run:` step executes in the package.
2. New explicit `vp install --frozen-lockfile` step.

`uses:` steps are unaffected by `working-directory`, so checkout and setup-vp still run at the repo root where they need to.

---

### Task 4: Install dependencies and verify

**Files:**

- Regenerate: `pnpm-lock.yaml`

- [ ] **Step 1: Install from workspace root**

Run from the repo root:

```bash
vp install
```

Expected: pnpm detects the new workspace, updates `pnpm-lock.yaml` to reflect the workspace layout, hoists shared tooling into `node_modules/` at the root, and creates `packages/content-layer/node_modules/` with the package's runtime deps.

If `vp install` fails with a lockfile mismatch (likely, since the current lockfile was written in single-package mode), re-run with:

```bash
vp install --no-frozen-lockfile
```

- [ ] **Step 2: Run tests from the package**

```bash
cd packages/content-layer && vp test && cd -
```

Expected: all existing tests pass — `codegen.test.ts`, `digest.test.ts`, `index.test.ts`, `runtime.test.ts`, `store.test.ts`.

- [ ] **Step 3: Run the build from the package**

```bash
cd packages/content-layer && vp run build && cd -
```

Expected: `packages/content-layer/dist/` is produced with `index.mjs`, `react.mjs`, `remix.mjs`, `loaders.mjs`, `runtime.mjs`, `store.mjs`, and the matching `.d.mts` files.

- [ ] **Step 4: Run the full check from the workspace root**

```bash
vp check
```

Expected: fmt + lint + type-aware checks all pass across the workspace.

- [ ] **Step 5: Confirm there are no stray artifacts at the old root `src/`**

```bash
ls src 2>/dev/null && echo "ERROR: src/ still exists at root" || echo "OK: no root src/"
ls dist 2>/dev/null && echo "ERROR: dist/ still exists at root" || echo "OK: no root dist/"
```

Expected: both lines print "OK".

---

### Task 5: Commit

- [ ] **Step 1: Review what's staged**

```bash
git status
git diff --stat HEAD
```

Expected: renames for every file under `src/` → `packages/content-layer/src/`, a deleted old root `src/`, modified `package.json`, `vite.config.ts`, `tsconfig.json`, `pnpm-lock.yaml`, `.github/workflows/publish.yml`, and new `pnpm-workspace.yaml`, `packages/content-layer/package.json`, `packages/content-layer/tsconfig.json`, `packages/content-layer/vite.config.ts`.

No `node_modules/` or `dist/` should appear — confirm via `.gitignore`.

- [ ] **Step 2: Stage and commit**

```bash
git add .
git commit -m "$(cat <<'EOF'
Restructure repo as pnpm workspace

Move the library into packages/content-layer/ and convert the root
into a workspace shell. Shared tooling (fmt, lint, Vite+ devDeps,
pnpm config) lives at the root; pack/test/build lives in the package.
The published package and the release workflow are functionally
equivalent to before.
EOF
)"
```
