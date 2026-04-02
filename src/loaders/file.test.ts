import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vite-plus/test";

import { createDataStore, createMetaStore } from "../store.ts";
import { file } from "./file.ts";

let tempDir: string;

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "cl-file-test-"));
});

afterEach(async () => {
    await rm(tempDir, { recursive: true });
});

function makeContext(store = createDataStore()) {
    return {
        collection: "test",
        store,
        meta: createMetaStore(),
        parseData: async <D extends Record<string, unknown>>(props: { data: D }) => props.data,
        renderMarkdown: async (md: string) => ({ html: md }),
        generateDigest: (data: unknown) => JSON.stringify(data),
        watcher: undefined as any,
    };
}

test("loads JSON array with id fields", async () => {
    let filePath = join(tempDir, "data.json");
    await writeFile(
        filePath,
        JSON.stringify([
            { id: "a", name: "Alice" },
            { id: "b", name: "Bob" },
        ]),
    );

    let loader = file(filePath);
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.values()).toHaveLength(2);
    expect(store.get("a")!.data.name).toBe("Alice");
});

test("loads JSON object with keys as IDs", async () => {
    let filePath = join(tempDir, "data.jsonc");
    await writeFile(filePath, '{ "x": { "val": 1 }, "y": { "val": 2 } }');

    let loader = file(filePath);
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.values()).toHaveLength(2);
    expect(store.get("x")!.data.val).toBe(1);
});

test("loads YAML file", async () => {
    let filePath = join(tempDir, "data.yaml");
    await writeFile(filePath, "a:\n  val: 1\nb:\n  val: 2\n");

    let loader = file(filePath);
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.values()).toHaveLength(2);
    expect(store.get("a")!.data.val).toBe(1);
});

test("uses custom parser", async () => {
    let filePath = join(tempDir, "data.txt");
    await writeFile(filePath, "custom");

    let loader = file(filePath, {
        parser: () => [{ id: "parsed", value: 42 }] as any,
    });
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.get("parsed")!.data.value).toBe(42);
});

test("getWatchedPaths returns file path", () => {
    let loader = file("/some/path.json");
    expect(loader.getWatchedPaths!()).toEqual(["/some/path.json"]);
});
