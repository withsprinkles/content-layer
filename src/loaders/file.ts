import { parse as parseJsonc } from "@std/jsonc";
import { parse as parseYaml } from "@std/yaml";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

import type { ContentLoader } from "../types.ts";

interface FileOptions {
    parser?: (text: string) => Record<string, Record<string, unknown>> | Record<string, unknown>[];
}

let YAML_EXTENSIONS = new Set([".yaml", ".yml"]);

function defaultParser(text: string, ext: string) {
    if (YAML_EXTENSIONS.has(ext)) {
        return parseYaml(text) as
            | Record<string, Record<string, unknown>>
            | Record<string, unknown>[];
    }
    return parseJsonc(text) as Record<string, Record<string, unknown>> | Record<string, unknown>[];
}

export function file(fileName: string, options?: FileOptions): ContentLoader {
    return {
        name: "file",
        schema: null as never,
        getWatchedPaths() {
            return [fileName];
        },
        async load(context) {
            let raw = await readFile(fileName, "utf-8");
            let ext = extname(fileName);
            let parsed = options?.parser ? options.parser(raw) : defaultParser(raw, ext);

            if (Array.isArray(parsed)) {
                for (let item of parsed) {
                    let record = item as Record<string, unknown>;
                    let id = record.id as string;
                    let data = await context.parseData({ id, data: record, filePath: fileName });
                    let digest = context.generateDigest(record);
                    context.store.set({ id, data, filePath: fileName, digest });
                }
            } else {
                for (let [id, value] of Object.entries(parsed)) {
                    let data = await context.parseData({ id, data: value, filePath: fileName });
                    let digest = context.generateDigest(value);
                    context.store.set({ id, data, filePath: fileName, digest });
                }
            }
        },
    };
}
