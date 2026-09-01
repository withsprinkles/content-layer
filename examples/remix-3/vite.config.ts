import mdx from "@mdx-js/rollup";
import { contentLayer } from "@withsprinkles/content-layer/remix";
import { defineConfig } from "vite-plus";

import { remix } from "./remix.plugin.ts";

export default defineConfig({
    plugins: [contentLayer(), mdx({ jsxImportSource: "remix/ui" }), remix()],
    css: { transformer: "lightningcss" },
    builder: {},
});
