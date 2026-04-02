import type { DataEntry, DataStore, MetaStore } from "./types.ts";

export function createDataStore<
    D extends Record<string, unknown> = Record<string, unknown>,
>(): DataStore<D> {
    let map = new Map<string, DataEntry>();

    return {
        clear() {
            map.clear();
        },
        delete(key) {
            map.delete(key);
        },
        entries() {
            return [...map.entries()] as [string, DataEntry<D>][];
        },
        get(key) {
            return map.get(key) as DataEntry<D> | undefined;
        },
        has(key) {
            return map.has(key);
        },
        keys() {
            return [...map.keys()];
        },
        set(entry) {
            let existing = map.get(entry.id);
            if (existing?.digest && entry.digest && existing.digest === entry.digest) {
                return false;
            }
            map.set(entry.id, entry);
            return true;
        },
        values() {
            return [...map.values()] as DataEntry<D>[];
        },
    };
}

export function createMetaStore(): MetaStore {
    let map = new Map<string, string>();

    return {
        delete(key) {
            map.delete(key);
        },
        get(key) {
            return map.get(key);
        },
        has(key) {
            return map.has(key);
        },
        set(key, value) {
            map.set(key, value);
        },
    };
}
