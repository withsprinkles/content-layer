import mdx from "@mdx-js/rollup";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import rsc from "@vitejs/plugin-rsc";
import { contentLayer } from "@withsprinkles/content-layer/react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [contentLayer(), mdx(), tailwindcss(), reactRouterRSC(), rsc()],
});
