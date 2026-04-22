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
        typecheck: {
            enabled: true,
            checker: "tsgo",
            tsconfig: "tsconfig.json",
        },
    },
});
