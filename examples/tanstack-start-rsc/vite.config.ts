import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { contentLayer } from "@withsprinkles/content-layer/react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        contentLayer({ configPath: "src/content.config.ts" }),
        mdx(),
        tailwindcss(),
        tanstackStart({ rsc: { enabled: true } }),
        rsc(),
        viteReact(),
    ],
});
