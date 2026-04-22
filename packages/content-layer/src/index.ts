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

/** Sync-only validate signature, compatible with `@remix-run/data-schema`'s Schema type. */
type SyncValidate<Output> = (
    value: unknown,
    options?: StandardSchemaV1.Options,
) => StandardSchemaV1.Result<Output>;

type SyncStandardSchema<Input, Output> = {
    "~standard": Omit<StandardSchemaV1.Props<Input, Output>, "validate"> & {
        validate: SyncValidate<Output>;
        types?: StandardSchemaV1.Types<Input, Output>;
    };
};

export type ReferenceSchema = SyncStandardSchema<string, Reference> & {
    "~run": (value: unknown, context: RunContext) => StandardSchemaV1.Result<Reference>;
    /**
     * Present for structural compatibility with `@remix-run/data-schema`'s
     * `Schema` type. Calling it returns the same schema unchanged — reference
     * IDs are strings, so additional checks belong on the outer combinator
     * that consumes the resolved entry, not on this helper.
     */
    pipe: (...checks: Array<{ check: (v: Reference) => boolean; message?: string }>) => ReferenceSchema;
    /** Same semantics as `pipe`: present for type compatibility; a no-op at runtime. */
    refine: (predicate: (v: Reference) => boolean, message?: string) => ReferenceSchema;
};

export function reference(collection: string): ReferenceSchema {
    function validate(value: unknown): StandardSchemaV1.Result<Reference> {
        if (typeof value !== "string") {
            return { issues: [{ message: "Expected a string reference ID" }] };
        }
        return { value: { collection, id: value } };
    }

    let schema: ReferenceSchema = {
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
        pipe(..._checks) {
            return schema;
        },
        refine(_predicate, _message) {
            return schema;
        },
    };

    return schema;
}
