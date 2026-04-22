# Monorepo Restructure

## Summary

Restructure the `@withsprinkles/content-layer` repository from a single-package layout into a pnpm workspace so that examples can live alongside the library. The published package and the CI release flow remain behavior-equivalent to today. No examples are added as part of this work; only the workspace scaffolding.

## Motivation

The repo currently ships a single library at the root. Adding runnable examples that consume the library needs a monorepo layout. The pnpm + Vite+ workspace model is the natural fit and matches the conventions Vite+ is designed around (`vp run -r`, `--filter`, package-task references).

## Scope

In scope:

- Move the library into `packages/content-layer/`.
- Introduce a workspace shell at the root.
- Split tooling config between the workspace root and the package.
- Update the publish workflow to operate from the package directory.
- Pre-declare `examples/*` in the workspace manifest so adding examples later requires no infra changes.

Out of scope:

- Adding any example. Examples will be added separately and will declare their own Vite+ tasks, typically with `dependsOn: ["@withsprinkles/content-layer#build"]`.
- Changes to the library's source, exports, or published surface.

## Target layout

```
content-layer/
├── .github/workflows/publish.yml    # updated: working-directory + install step
├── .vscode/settings.json
├── .node-version
├── .gitignore
├── AGENTS.md
├── CLAUDE.md → AGENTS.md
├── LICENSE
├── README.md
├── package.json                     # workspace root, private: true, no name
├── pnpm-workspace.yaml              # new
├── pnpm-lock.yaml
├── tsconfig.json                    # shared base
├── vite.config.ts                   # fmt + lint only
└── packages/
    └── content-layer/
        ├── package.json             # current root package.json, trimmed
        ├── tsconfig.json            # extends ../../tsconfig.json
        ├── vite.config.ts           # pack + test + package tasks
        └── src/                     # all existing source, unchanged
```

## Workspace root

### `package.json`

- `private: true`.
- No `name`, `version`, `main`, `exports`, `files`, `peerDependencies`, `scripts`.
- `packageManager: "pnpm@10.33.0"` moves here from the current root `package.json`.
- `pnpm.overrides` moves here from the current root `package.json`.
- `devDependencies`: the Vite+ tooling dependencies (`vite-plus`, the `vite` npm-alias, the `vitest` npm-alias, `@types/node`, `@typescript/native-preview`) move here. They are shared across all packages in the workspace.

### `pnpm-workspace.yaml`

```yaml
packages:
    - packages/*
    - examples/*
```

Pre-declaring `examples/*` means adding an example later requires no change to the workspace manifest.

### `vite.config.ts`

Contains only workspace-wide tooling config:

- `fmt` block — verbatim from the current root `vite.config.ts`.
- `lint` block — verbatim from the current root `vite.config.ts`.

No `run.tasks` block. Per-example build/dev orchestration will be expressed later as `dependsOn` in each example's own `vite.config.ts`.

### `tsconfig.json`

Serves as the shared base. Same `compilerOptions` as today, with `"include"` dropped — a base config should not specify inputs; packages set their own `include`.

## Package: `packages/content-layer`

### `package.json`

Start from the current root `package.json` and apply these changes:

- Remove `packageManager` (workspace root owns it).
- Remove `pnpm.overrides` (workspace root owns it).
- Remove the Vite+ tooling `devDependencies` (hoisted to the workspace root).

Everything else is preserved verbatim — `name`, `version`, `description`, `homepage`, `repository`, `license`, `author`, `type`, `files`, `types`, `exports`, `scripts.prepublishOnly`, runtime `dependencies`, and `peerDependencies`.

This keeps the published tarball byte-identical to today's release.

### `tsconfig.json`

Extends `../../tsconfig.json`. Sets `include: ["src"]`.

### `vite.config.ts`

Package-specific config only:

- `pack` block — verbatim from the current root config.
- `test.include` — verbatim from the current root config.
- `run.tasks` — verbatim: `dev` → `vp pack --watch`, `build` → `vp pack`.

### `src/`

The current `src/` directory moves here unchanged.

## CI: `.github/workflows/publish.yml`

The job gets a single `defaults.run.working-directory: packages/content-layer` so every `run:` step executes inside the package. `uses:` steps (checkout, setup-vp) are unaffected, which is what we want — checkout needs the repo root.

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

1. Job-level `defaults.run.working-directory` pointed at the package.
2. A new explicit `vp install --frozen-lockfile` step — reliable workspace install, and sets up the package's local `node_modules`.

Trigger, permissions, and the `setup-vp` step are unchanged.

## Verification

After restructuring:

- `vp install` at the workspace root succeeds.
- `vp check` at the workspace root passes (fmt + lint inherited from root).
- `vp test` from `packages/content-layer/` passes.
- `vp run build` from `packages/content-layer/` produces a `dist/` equivalent to today's.
- `npm pack` from `packages/content-layer/` produces a tarball with the same `files` contents as today (modulo the removed workspace-level fields in `package.json`).
- The publish workflow structure is unchanged beyond `defaults.run.working-directory` and the new install step.
