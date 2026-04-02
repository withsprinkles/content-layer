import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ContentLoader, SchemaContext } from "./types.ts";

export type {
    Collection,
    ContentLoader,
    DataEntry,
    DataStore,
    GenerateIdOptions,
    LoaderContext,
    MarkdownHeading,
    MetaStore,
    ParseDataOptions,
    RenderedContent,
    SchemaContext,
} from "./types.ts";

export function defineCollection<
    S extends StandardSchemaV1<any, any> | ((ctx: SchemaContext) => StandardSchemaV1<any, any>),
>(input: { loader: ContentLoader; schema: S }): { loader: ContentLoader; schema: S } {
    return input;
}

export function reference(
    collection: string,
): StandardSchemaV1<string, { collection: string; id: string }> {
    return {
        "~standard": {
            version: 1,
            vendor: "sprinkles",
            validate(value) {
                if (typeof value !== "string") {
                    return { issues: [{ message: "Expected a string reference ID" }] };
                }
                return { value: { collection, id: value } };
            },
        },
    };
}
