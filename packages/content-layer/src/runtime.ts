import type { DataEntry, DataStore, MarkdownHeading } from "./types.ts";

type EntryImporter = () => Promise<{ default: unknown; headings?: MarkdownHeading[] }>;

interface ReferenceEntry {
    collection: string;
    id: string;
}

export function createRuntime(
    stores: Map<string, DataStore>,
    importers: Record<string, EntryImporter>,
) {
    async function getCollection(
        collection: string,
        filter?: (entry: DataEntry) => unknown,
    ): Promise<DataEntry[]> {
        let store = stores.get(collection);
        if (!store) return [];
        let entries = store.values();
        if (filter) {
            return entries.filter(filter);
        }
        return entries;
    }

    async function getEntry(
        collectionOrRef: string | ReferenceEntry,
        slug?: string,
    ): Promise<DataEntry | undefined> {
        if (typeof collectionOrRef === "object") {
            let store = stores.get(collectionOrRef.collection);
            return store?.get(collectionOrRef.id);
        }
        let store = stores.get(collectionOrRef);
        return store?.get(slug!);
    }

    async function getEntries(refs: ReferenceEntry[]): Promise<DataEntry[]> {
        let results: DataEntry[] = [];
        for (let ref of refs) {
            let entry = await getEntry(ref);
            if (entry) {
                results.push(entry);
            }
        }
        return results;
    }

    function findCollectionForEntry(entry: DataEntry): string {
        for (let [name, store] of stores) {
            if (store.has(entry.id)) {
                return name;
            }
        }
        throw new Error(`Entry "${entry.id}" not found in any collection`);
    }

    async function findImporter(
        entry: DataEntry,
    ): Promise<{ default: unknown; headings?: MarkdownHeading[] }> {
        let collectionName = findCollectionForEntry(entry);
        let key = `${collectionName}/${entry.id}`;
        let importer = importers[key];
        if (!importer) {
            throw new Error(`No content found for entry "${key}"`);
        }
        return importer();
    }

    return { getCollection, getEntry, getEntries, findImporter };
}
