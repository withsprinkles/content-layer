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
    test: {
        include: ["**/*.test.ts"],
    },
});
