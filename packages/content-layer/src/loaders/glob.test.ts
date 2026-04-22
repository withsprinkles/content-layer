import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vite-plus/test";

import { createDataStore, createMetaStore } from "../store.ts";
import { glob } from "./glob.ts";

let tempDir: string;

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "cl-glob-test-"));
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

test("loads markdown files with frontmatter", async () => {
    await writeFile(join(tempDir, "hello.md"), "---\ntitle: Hello\n---\nBody content here");
    await writeFile(join(tempDir, "world.md"), "---\ntitle: World\n---\nMore content");

    let loader = glob({ pattern: "**/*.md", base: tempDir });
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.values()).toHaveLength(2);
    let entry = store.get("hello");
    expect(entry).toBeDefined();
    expect(entry!.data.title).toBe("Hello");
    expect(entry!.body).toBe("Body content here");
});

test("loads JSON files", async () => {
    await writeFile(join(tempDir, "item.json"), JSON.stringify({ name: "Test Item" }));

    let loader = glob({ pattern: "**/*.json", base: tempDir });
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.values()).toHaveLength(1);
    expect(store.get("item")!.data.name).toBe("Test Item");
});

test("loads YAML files", async () => {
    await writeFile(join(tempDir, "data.yaml"), "key: value\n");

    let loader = glob({ pattern: "**/*.yaml", base: tempDir });
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.values()).toHaveLength(1);
    expect(store.get("data")!.data.key).toBe("value");
});

test("generates ID from path, stripping extension", async () => {
    await mkdir(join(tempDir, "sub"), { recursive: true });
    await writeFile(join(tempDir, "sub", "nested.md"), "---\ntitle: Nested\n---\nbody");

    let loader = glob({ pattern: "**/*.md", base: tempDir });
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.has("sub/nested")).toBe(true);
});

test("custom generateId", async () => {
    await writeFile(join(tempDir, "post.md"), "---\ntitle: Post\n---\nbody");

    let loader = glob({
        pattern: "**/*.md",
        base: tempDir,
        generateId: ({ data }) => (data.title as string).toLowerCase(),
    });
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.has("post")).toBe(true);
});

test("getWatchedPaths returns base directory", () => {
    let loader = glob({ pattern: "**/*.md", base: "/some/dir" });
    expect(loader.getWatchedPaths!()).toEqual(["/some/dir"]);
});

test("handles array of patterns", async () => {
    await writeFile(join(tempDir, "a.md"), "---\ntitle: A\n---\nbody");
    await writeFile(join(tempDir, "b.yaml"), "title: B\n");

    let loader = glob({ pattern: ["**/*.md", "**/*.yaml"], base: tempDir });
    let store = createDataStore();
    await loader.load(makeContext(store));

    expect(store.values()).toHaveLength(2);
});
