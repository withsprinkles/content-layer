import type { Plugin } from "vite";

import type { ContentLayerPluginOptions } from "./plugin.ts";
import type { FrameworkAdapter } from "./types.ts";

import { createContentLayerPlugin } from "./plugin.ts";

let adapter: FrameworkAdapter = {
    preamble: 'import "server-only";',
    componentType: 'import("react").ComponentType',
};

export function contentLayer(options?: ContentLayerPluginOptions): Plugin {
    return createContentLayerPlugin({ ...options, adapter });
}
