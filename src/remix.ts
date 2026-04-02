import type { Plugin } from "vite";

import type { ContentLayerPluginOptions } from "./plugin.ts";
import type { FrameworkAdapter } from "./types.ts";

import { createContentLayerPlugin } from "./plugin.ts";

let adapter: FrameworkAdapter = {
    wrapContent: "let MdxComponent = mod.default; let Content = () => () => MdxComponent({});",
    componentType: '() => () => import("remix/component").RemixNode',
};

export function contentLayer(options?: ContentLayerPluginOptions): Plugin {
    return createContentLayerPlugin({ ...options, adapter });
}
