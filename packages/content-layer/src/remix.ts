import type { Handle, RemixNode } from "remix/ui";
import type { Plugin } from "vite";

import type { ContentLayerPluginOptions } from "./plugin.ts";
import type { FrameworkAdapter } from "./types.ts";

import { createContentLayerPlugin } from "./plugin.ts";

// MDX component prop types for remix/ui, mirroring the shape of @types/mdx but
// replacing React component types with remix/ui factories.

type StringComponent = keyof JSX.IntrinsicElements;

type FunctionComponent<Props> = (handle: Handle<Props>) => () => RemixNode;

type Component<Props> = FunctionComponent<Props> | StringComponent;

interface NestedMDXComponents {
    [key: string]: Component<any> | NestedMDXComponents;
}

/**
 * MDX components that may be passed as the `components` prop.
 *
 * The key is the name of the element to override; the value is the remix/ui
 * factory (or intrinsic tag name) to render in its place.
 */
export type MDXComponents = NestedMDXComponents & {
    [Key in StringComponent]?: Component<JSX.IntrinsicElements[Key]>;
} & {
    /**
     * If a wrapper component is defined, the MDX content will be wrapped inside of it.
     */
    wrapper?: Component<any>;
};

/**
 * The props that may be passed to an MDX component.
 */
export interface MDXProps {
    [key: string]: unknown;
    components?: MDXComponents;
}

/**
 * The type of the default export of an MDX module, as exposed by the Remix
 * adapter's generated `Content` component.
 */
export type MDXContent = (handle: Handle<MDXProps>) => () => RemixNode;

let adapter: FrameworkAdapter = {
    wrapContent:
        "let MdxComponent = mod.default; let Content = (handle) => () => MdxComponent(handle?.props ?? {});",
    componentType: 'import("@withsprinkles/content-layer/remix").MDXContent',
};

export function contentLayer(options?: ContentLayerPluginOptions): Plugin {
    return createContentLayerPlugin({ ...options, adapter });
}
