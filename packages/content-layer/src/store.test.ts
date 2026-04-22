import { expect, test } from "vite-plus/test";

import { createDataStore, createMetaStore } from "./store.ts";

test("set and get an entry", () => {
    let store = createDataStore();
    store.set({ id: "a", data: { title: "Hello" } });
    expect(store.get("a")).toEqual({ id: "a", data: { title: "Hello" } });
});

test("returns undefined for missing entry", () => {
    let store = createDataStore();
    expect(store.get("missing")).toBeUndefined();
});

test("set returns true for new entry", () => {
    let store = createDataStore();
    expect(store.set({ id: "a", data: {} })).toBe(true);
});

test("set skips update when digests match", () => {
    let store = createDataStore();
    store.set({ id: "a", data: { v: 1 }, digest: "abc" });
    let result = store.set({ id: "a", data: { v: 2 }, digest: "abc" });
    expect(result).toBe(false);
    expect(store.get("a")!.data).toEqual({ v: 1 });
});

test("set updates when digests differ", () => {
    let store = createDataStore();
    store.set({ id: "a", data: { v: 1 }, digest: "abc" });
    let result = store.set({ id: "a", data: { v: 2 }, digest: "def" });
    expect(result).toBe(true);
    expect(store.get("a")!.data).toEqual({ v: 2 });
});

test("set updates when existing entry has no digest", () => {
    let store = createDataStore();
    store.set({ id: "a", data: { v: 1 } });
    let result = store.set({ id: "a", data: { v: 2 }, digest: "abc" });
    expect(result).toBe(true);
});

test("values returns all entries", () => {
    let store = createDataStore();
    store.set({ id: "a", data: {} });
    store.set({ id: "b", data: {} });
    expect(store.values()).toHaveLength(2);
});

test("keys returns all ids", () => {
    let store = createDataStore();
    store.set({ id: "x", data: {} });
    store.set({ id: "y", data: {} });
    expect(store.keys()).toEqual(["x", "y"]);
});

test("entries returns key-value pairs", () => {
    let store = createDataStore();
    store.set({ id: "a", data: { n: 1 } });
    let [[key, entry]] = store.entries();
    expect(key).toBe("a");
    expect(entry.id).toBe("a");
});

test("delete removes an entry", () => {
    let store = createDataStore();
    store.set({ id: "a", data: {} });
    store.delete("a");
    expect(store.has("a")).toBe(false);
});

test("clear removes all entries", () => {
    let store = createDataStore();
    store.set({ id: "a", data: {} });
    store.set({ id: "b", data: {} });
    store.clear();
    expect(store.values()).toHaveLength(0);
});

test("has returns correct boolean", () => {
    let store = createDataStore();
    store.set({ id: "a", data: {} });
    expect(store.has("a")).toBe(true);
    expect(store.has("b")).toBe(false);
});

test("meta store set/get/has/delete", () => {
    let meta = createMetaStore();
    meta.set("token", "abc123");
    expect(meta.get("token")).toBe("abc123");
    expect(meta.has("token")).toBe(true);
    meta.delete("token");
    expect(meta.has("token")).toBe(false);
    expect(meta.get("token")).toBeUndefined();
});
