import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { FSWatcher } from "vite";

export interface DataEntry<D extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    data: D;
    filePath?: string;
    body?: string;
    digest?: string;
    rendered?: RenderedContent;
}

export interface DataStore<D extends Record<string, unknown> = Record<string, unknown>> {
    get: (key: string) => DataEntry<D> | undefined;
    set: (entry: DataEntry) => boolean;
    entries: () => [id: string, DataEntry<D>][];
    keys: () => string[];
    values: () => DataEntry<D>[];
    delete: (key: string) => void;
    clear: () => void;
    has: (key: string) => boolean;
}

export interface MetaStore {
    get: (key: string) => string | undefined;
    set: (key: string, value: string) => void;
    delete: (key: string) => void;
    has: (key: string) => boolean;
}

export interface ParseDataOptions<Data extends Record<string, unknown>> {
    id: string;
    data: Data;
    filePath?: string;
}

export interface MarkdownHeading {
    depth: number;
    slug: string;
    text: string;
}

export interface RenderedContent {
    html: string;
    metadata?: {
        imagePaths?: string[];
        headings?: MarkdownHeading[];
        frontmatter?: Record<string, any>;
        [key: string]: unknown;
    };
}

export interface LoaderContext<D extends Record<string, unknown> = Record<string, unknown>> {
    collection: string;
    store: DataStore<D>;
    meta: MetaStore;
    parseData: <Data extends Record<string, unknown>>(
        props: ParseDataOptions<Data>,
    ) => Promise<Data>;
    renderMarkdown: (markdown: string) => Promise<RenderedContent>;
    generateDigest: (data: Record<string, unknown> | string) => string;
    watcher: FSWatcher;
}

export interface ContentLoader {
    name: string;
    load: (context: LoaderContext) => Promise<void> | void;
    schema:
        | StandardSchemaV1
        | Promise<StandardSchemaV1>
        | (() => StandardSchemaV1 | Promise<StandardSchemaV1>);
    getWatchedPaths?: () => string[];
}

export interface SchemaContext {
    image: () => StandardSchemaV1<unknown, string>;
}

export interface Collection {
    loader: ContentLoader;
    schema: StandardSchemaV1 | ((context: SchemaContext) => StandardSchemaV1);
}

export interface GenerateIdOptions {
    entry: string;
    base: URL;
    data: Record<string, unknown>;
}

export interface FrameworkAdapter {
    preamble?: string;
    wrapContent?: string;
    componentType: string;
}
