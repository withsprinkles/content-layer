import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { contentLayer } from "@withsprinkles/content-layer/react";
import { redwood } from "rwsdk/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        contentLayer({ configPath: "src/content.config.ts" }),
        mdx(),
        cloudflare({ viteEnvironment: { name: "worker" } }),
        redwood(),
        tailwindcss(),
    ],
    // Skip pre-bundling rwsdk's condition-gated runtime entries — they resolve
    // differently per environment (react-server vs. ssr) and can't be safely
    // bundled together by the dev dep optimizer.
    environments: {
        worker: {
            optimizeDeps: {
                exclude: ["rwsdk/__ssr", "rwsdk/__ssr_bridge"],
            },
        },
        ssr: {
            optimizeDeps: {
                exclude: ["rwsdk/__ssr", "rwsdk/__ssr_bridge"],
            },
        },
    },
});
