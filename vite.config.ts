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
    staged: {
        "*.{js,mjs,cjs,ts,mts,cts,tsx,json,jsonc,md,yaml,yml}": "vp fmt",
        "*.{js,mjs,cjs,ts,mts,cts,tsx}": "vp lint",
    },
});
