import { expect, test } from "vite-plus/test";

import { createRuntime } from "./runtime.ts";
import { createDataStore } from "./store.ts";

function makeStores() {
    let blogStore = createDataStore();
    blogStore.set({ id: "hello", data: { title: "Hello" } });
    blogStore.set({ id: "world", data: { title: "World" } });

    let authorsStore = createDataStore();
    authorsStore.set({ id: "mark", data: { name: "Mark" } });

    let stores = new Map([
        ["blog", blogStore],
        ["authors", authorsStore],
    ]);
    return stores;
}

test("getCollection returns all entries", async () => {
    let stores = makeStores();
    let { getCollection } = createRuntime(stores, {});
    let entries = await getCollection("blog");
    expect(entries).toHaveLength(2);
});

test("getCollection returns empty array for unknown collection", async () => {
    let stores = makeStores();
    let { getCollection } = createRuntime(stores, {});
    let entries = await getCollection("nonexistent");
    expect(entries).toEqual([]);
});

test("getCollection with filter", async () => {
    let stores = makeStores();
    let { getCollection } = createRuntime(stores, {});
    let entries = await getCollection("blog", e => e.data.title === "Hello");
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("hello");
});

test("getEntry by collection and slug", async () => {
    let stores = makeStores();
    let { getEntry } = createRuntime(stores, {});
    let entry = await getEntry("blog", "hello");
    expect(entry).toBeDefined();
    expect(entry!.data.title).toBe("Hello");
});

test("getEntry by reference object", async () => {
    let stores = makeStores();
    let { getEntry } = createRuntime(stores, {});
    let entry = await getEntry({ collection: "authors", id: "mark" });
    expect(entry).toBeDefined();
    expect(entry!.data.name).toBe("Mark");
});

test("getEntry returns undefined for missing entry", async () => {
    let stores = makeStores();
    let { getEntry } = createRuntime(stores, {});
    let entry = await getEntry("blog", "missing");
    expect(entry).toBeUndefined();
});

test("getEntries resolves array of references", async () => {
    let stores = makeStores();
    let { getEntries } = createRuntime(stores, {});
    let entries = await getEntries([
        { collection: "blog", id: "hello" },
        { collection: "blog", id: "missing" },
        { collection: "authors", id: "mark" },
    ]);
    expect(entries).toHaveLength(2);
});

test("findImporter returns the imported module", async () => {
    let stores = makeStores();
    let importers = {
        "blog/hello": () => Promise.resolve({ default: () => "component", headings: [] }),
    };
    let { findImporter } = createRuntime(stores, importers);
    let mod = await findImporter({ id: "hello", data: { title: "Hello" } });
    expect(mod.default).toBeDefined();
});

test("findImporter throws for entry with no importer", async () => {
    let stores = makeStores();
    let { findImporter } = createRuntime(stores, {});
    await expect(findImporter({ id: "hello", data: { title: "Hello" } })).rejects.toThrow(
        'No content found for entry "blog/hello"',
    );
});
