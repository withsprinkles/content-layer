import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

import { mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import type {
    Collection,
    DataStore,
    FrameworkAdapter,
    LoaderContext,
    ParseDataOptions,
    SchemaContext,
} from "./types.ts";

import { generateTypes } from "./codegen.ts";
import { generateDigest } from "./digest.ts";
import { createDataStore, createMetaStore } from "./store.ts";

function toJSLiteral(value: unknown): string {
    if (value === null || value === undefined) return String(value);
    if (typeof value === "boolean" || typeof value === "number") return String(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (value instanceof Date) return `new Date(${JSON.stringify(value.toISOString())})`;
    if (Array.isArray(value)) return `[${value.map(toJSLiteral).join(",")}]`;
    if (typeof value === "object") {
        let entries = Object.entries(value as Record<string, unknown>).map(
            ([k, v]) => `${JSON.stringify(k)}:${toJSLiteral(v)}`,
        );
        return `{${entries.join(",")}}`;
    }
    return JSON.stringify(value);
}

let VIRTUAL_MODULE_ID = "sprinkles:content";
let RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_MODULE_ID}`;
let VIRTUAL_STORE_ID = "virtual:sprinkles-content/store";
let RESOLVED_STORE_ID = `\0${VIRTUAL_STORE_ID}`;
let VIRTUAL_ENTRY_PREFIX = "virtual:sprinkles-content/entry/";
let RESOLVED_ENTRY_PREFIX = VIRTUAL_ENTRY_PREFIX;

export interface ContentLayerPluginOptions {
    configPath?: string;
}

interface InternalPluginOptions extends ContentLayerPluginOptions {
    adapter: FrameworkAdapter;
}

export function createContentLayerPlugin(options: InternalPluginOptions): Plugin {
    let { configPath = "app/content.config.ts", adapter } = options;
    let config: ResolvedConfig;
    let stores = new Map<string, DataStore>();
    let entryFilePaths = new Map<string, { collection: string; id: string }[]>();
    let watchedContentPaths = new Set<string>();

    async function loadConfig(root: string): Promise<Record<string, Collection>> {
        let fullPath = resolve(root, configPath);
        let mod = await import(/* @vite-ignore */ `${fullPath}?t=${Date.now()}`);
        return mod.collections ?? {};
    }

    function createParseData(schema: Collection["schema"]): LoaderContext["parseData"] {
        return async <Data extends Record<string, unknown>>(
            props: ParseDataOptions<Data>,
        ): Promise<Data> => {
            if (!schema) return props.data;
            // A schema can be either a Standard Schema object or a factory
            // that accepts a SchemaContext. Some Standard Schema libraries
            // (e.g. Arktype) expose their schemas as callable functions with
            // a "~standard" property, so distinguish the two by that property.
            let isFactory = typeof schema === "function" && !("~standard" in (schema as object));
            let resolvedSchema = isFactory
                ? (schema as (ctx: SchemaContext) => StandardSchemaV1<unknown, unknown>)({
                      image: () => ({
                          "~standard": {
                              version: 1 as const,
                              vendor: "sprinkles",
                              validate: (v: unknown) => ({ value: v as string }),
                          },
                      }),
                  })
                : (schema as StandardSchemaV1<unknown, unknown>);
            let result = await resolvedSchema["~standard"].validate(props.data);
            if ("issues" in result) {
                let messages = (result.issues as { message: string }[])
                    .map(i => i.message)
                    .join(", ");
                throw new Error(`Validation failed for entry "${props.id}": ${messages}`);
            }
            return result.value as Data;
        };
    }

    async function runLoaders(
        root: string,
        loadedCollections: Record<string, Collection>,
        server?: ViteDevServer,
    ) {
        let newStores = new Map<string, DataStore>();
        let newEntryFilePaths = new Map<string, { collection: string; id: string }[]>();
        let newWatchedPaths = new Set<string>();

        newWatchedPaths.add(resolve(root, configPath));

        for (let [name, collection] of Object.entries(loadedCollections)) {
            let store = createDataStore();
            let meta = createMetaStore();
            newStores.set(name, store);

            let loaderPaths = collection.loader.getWatchedPaths?.() ?? [];
            for (let p of loaderPaths) {
                newWatchedPaths.add(resolve(root, p));
            }

            let context: LoaderContext = {
                collection: name,
                store,
                meta,
                parseData: createParseData(collection.schema),
                renderMarkdown: async markdown => ({ html: markdown }),
                generateDigest,
                watcher: server?.watcher as LoaderContext["watcher"],
            };

            await collection.loader.load(context);

            for (let entry of store.values()) {
                if (entry.filePath) {
                    let key = resolve(root, entry.filePath);
                    let existing = newEntryFilePaths.get(key) ?? [];
                    existing.push({ collection: name, id: entry.id });
                    newEntryFilePaths.set(key, existing);
                }
            }
        }

        stores = newStores;
        entryFilePaths = newEntryFilePaths;
        watchedContentPaths = newWatchedPaths;
    }

    function isContentPath(filePath: string): boolean {
        let resolved = resolve(filePath);
        if (entryFilePaths.has(resolved)) return true;
        if (watchedContentPaths.has(resolved)) return true;
        for (let watched of watchedContentPaths) {
            if (resolved.startsWith(`${watched}/`)) return true;
        }
        return false;
    }

    function serializeStores(): string {
        let data: Record<string, Record<string, unknown>> = {};
        for (let [name, store] of stores) {
            let entries: Record<string, unknown> = {};
            for (let entry of store.values()) {
                let { body: _body, rendered: _rendered, ...rest } = entry;
                entries[entry.id] = { ...rest, collection: name };
            }
            data[name] = entries;
        }
        return toJSLiteral(data);
    }

    function generateImporterMap(): string {
        let lines: string[] = [];
        for (let [name, store] of stores) {
            for (let entry of store.values()) {
                if (entry.body) {
                    let key = `${name}/${entry.id}`;
                    lines.push(
                        `${JSON.stringify(key)}: () => import(${JSON.stringify(`${VIRTUAL_ENTRY_PREFIX}${key}`)})`,
                    );
                }
            }
        }
        return `{${lines.join(",\n")}}`;
    }

    async function writeTypes(root: string, cols: Record<string, Collection>) {
        let outDir = join(root, ".sprinkles", "content-layer");
        await mkdir(outDir, { recursive: true });

        let collectionInfos: Record<string, { schema: unknown }> = {};
        for (let [name, collection] of Object.entries(cols)) {
            collectionInfos[name] = { schema: collection.schema };
        }
        let configRelPath = relative(outDir, resolve(root, configPath)).replace(/\\/g, "/");
        let types = generateTypes(
            collectionInfos as Record<string, { schema: never }>,
            configRelPath,
            adapter.componentType,
        );
        await writeFile(join(outDir, "content.d.ts"), types);
    }

    function invalidateContentModules(server: ViteDevServer, entryKeys?: string[]) {
        let moduleIds = [RESOLVED_VIRTUAL_ID, RESOLVED_STORE_ID];
        if (entryKeys) {
            for (let key of entryKeys) {
                moduleIds.push(`${VIRTUAL_ENTRY_PREFIX}${key}.mdx`);
            }
        }

        for (let env of Object.values(server.environments)) {
            for (let id of moduleIds) {
                let mod = env.moduleGraph.getModuleById(id);
                if (mod) env.moduleGraph.invalidateModule(mod);
            }
        }
    }

    async function handleContentChange(server: ViteDevServer, filePath: string) {
        let resolvedPath = resolve(filePath);
        if (!isContentPath(resolvedPath)) return;

        let previousEntryKeys: string[] = [];
        let mappings = entryFilePaths.get(resolvedPath);
        if (mappings) {
            for (let m of mappings) {
                previousEntryKeys.push(`${m.collection}/${m.id}`);
            }
        }

        let loadedCollections: Record<string, Collection>;
        try {
            loadedCollections = await loadConfig(config.root);
        } catch (error) {
            config.logger.error(
                `[content-layer] Failed to load content config:\n${error instanceof Error ? error.message : String(error)}`,
            );
            return;
        }

        await writeTypes(config.root, loadedCollections);

        try {
            await runLoaders(config.root, loadedCollections, server);
        } catch (error) {
            config.logger.error(
                `[content-layer] ${error instanceof Error ? error.message : String(error)}`,
            );
            return;
        }

        let newMappings = entryFilePaths.get(resolvedPath);
        let entryKeys = [...previousEntryKeys];
        if (newMappings) {
            for (let m of newMappings) {
                let key = `${m.collection}/${m.id}`;
                if (!entryKeys.includes(key)) entryKeys.push(key);
            }
        }

        invalidateContentModules(server, entryKeys);
        server.hot.send({ type: "full-reload" });
    }

    return {
        name: "sprinkles-content-layer",

        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },

        async buildStart() {
            let loadedCollections: Record<string, Collection>;
            try {
                loadedCollections = await loadConfig(config.root);
            } catch (error) {
                if (config.command === "build") throw error;
                config.logger.error(
                    `[content-layer] Failed to load content config:\n${error instanceof Error ? error.message : String(error)}`,
                );
                return;
            }

            await writeTypes(config.root, loadedCollections);

            try {
                await runLoaders(config.root, loadedCollections);
            } catch (error) {
                if (config.command === "build") throw error;
                config.logger.error(
                    `[content-layer] Failed to load content:\n${error instanceof Error ? error.message : String(error)}`,
                );
            }
        },

        resolveId(id) {
            if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_ID;
            if (id === VIRTUAL_STORE_ID) return RESOLVED_STORE_ID;
            if (id.startsWith(VIRTUAL_ENTRY_PREFIX) && !id.endsWith(".mdx")) {
                return `${id}.mdx`;
            }
        },

        load(id) {
            if (id === RESOLVED_VIRTUAL_ID) {
                let preamble = adapter.preamble ? `${adapter.preamble}\n` : "";
                let wrapContent = adapter.wrapContent ?? "let Content = mod.default;";

                return `${preamble}export { defineCollection, reference } from "@withsprinkles/content-layer";

import { createRuntime } from "@withsprinkles/content-layer/internal/runtime";
import { createDataStore } from "@withsprinkles/content-layer/internal/store";

let storeData = ${serializeStores()};

let importers = ${generateImporterMap()};

let stores = new Map();
for (let [name, entries] of Object.entries(storeData)) {
  let store = createDataStore();
  for (let entry of Object.values(entries)) {
    store.set(entry);
  }
  stores.set(name, store);
}

let { getCollection, getEntry, getEntries, findImporter } = createRuntime(stores, importers);
export { getCollection, getEntry, getEntries };

export async function render(entry) {
  let mod = await findImporter(entry);
  ${wrapContent}
  return { Content, headings: mod.headings ?? [] };
}
`;
            }

            if (id === RESOLVED_STORE_ID) {
                return `export default ${serializeStores()};`;
            }

            if (id.startsWith(RESOLVED_ENTRY_PREFIX) && id.endsWith(".mdx")) {
                let path = id.slice(RESOLVED_ENTRY_PREFIX.length, -4);
                let slashIndex = path.indexOf("/");
                let collectionName = path.slice(0, slashIndex);
                let entryId = path.slice(slashIndex + 1);

                let store = stores.get(collectionName);
                if (!store) return null;

                let entry = store.get(entryId);
                if (!entry?.body) return null;

                return { code: entry.body, map: null };
            }
        },

        configureServer(server) {
            server.watcher.on("change", filePath => handleContentChange(server, filePath));
            server.watcher.on("add", filePath => handleContentChange(server, filePath));
            server.watcher.on("unlink", filePath => handleContentChange(server, filePath));
        },

        handleHotUpdate({ file }) {
            let resolvedPath = resolve(file);
            if (isContentPath(resolvedPath)) {
                return [];
            }
        },
    };
}
