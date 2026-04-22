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

type Reference = { collection: string; id: string };

type RunContext = {
    path: NonNullable<StandardSchemaV1.Issue["path"]>;
    options?: unknown;
};

export function reference(
    collection: string,
): StandardSchemaV1<string, Reference> & {
    "~run": (value: unknown, context: RunContext) => StandardSchemaV1.Result<Reference>;
} {
    function validate(value: unknown): StandardSchemaV1.Result<Reference> {
        if (typeof value !== "string") {
            return { issues: [{ message: "Expected a string reference ID" }] };
        }
        return { value: { collection, id: value } };
    }

    return {
        "~standard": {
            version: 1,
            vendor: "sprinkles",
            validate,
        },
        "~run"(value, context) {
            let result = validate(value);
            if (result.issues) {
                return {
                    issues: result.issues.map(issue => {
                        let path = issue.path ?? context.path;
                        return path.length > 0 ? { ...issue, path } : issue;
                    }),
                };
            }
            return result;
        },
    };
}
