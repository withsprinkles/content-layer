import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { contentLayer } from "@withsprinkles/content-layer/react";
import { defineConfig } from "waku/config";

export default defineConfig({
    vite: {
        plugins: [
            contentLayer({ configPath: "src/content.config.ts" }),
            mdx(),
            tailwindcss(),
            react(),
        ],
    },
});
