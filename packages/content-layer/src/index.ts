import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ContentLoader, SchemaContext } from "./types.ts";

export type { StandardSchemaV1 };

export type {
    Collection,
    ContentLoader,
    DataEntry,
    DataStore,
    GenerateIdOptions,
    InferSchemaOutput,
    LoaderContext,
    MarkdownHeading,
    MetaStore,
    ParseDataOptions,
    RenderedContent,
    ResolveSchema,
    SchemaContext,
} from "./types.ts";

export function defineCollection<
    S extends StandardSchemaV1<any, any> | ((ctx: SchemaContext) => StandardSchemaV1<any, any>),
>(input: { loader: ContentLoader; schema: S }): { loader: ContentLoader; schema: S } {
    return input;
}

type Reference<C extends string = string> = { collection: C; id: string };

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

/** A reusable check, mirroring `@remix-run/data-schema`'s `Check` type. */
type SchemaCheck<Output> = {
    check: (value: Output) => boolean;
    message?: string;
    code?: string;
    values?: Record<string, unknown>;
};

/**
 * The chainable sync-schema surface `@remix-run/data-schema` requires of any
 * schema handed to one of its combinators.
 */
type ChainableSchema<Input, Output> = SyncStandardSchema<Input, Output> & {
    "~run": (value: unknown, context: RunContext) => StandardSchemaV1.Result<Output>;
    /**
     * Present for structural compatibility with `@remix-run/data-schema`'s
     * `Schema` type. Calling it returns the same schema unchanged — these
     * schemas validate a fixed shape, so additional checks belong on the outer
     * combinator that consumes the resolved entry, not on this helper.
     */
    pipe: (...checks: SchemaCheck<Output>[]) => ChainableSchema<Input, Output>;
    /** Same semantics as `pipe`: present for type compatibility; a no-op at runtime. */
    refine: (
        predicate: (value: Output) => boolean,
        message?: string,
    ) => ChainableSchema<Input, Output>;
    /** Maps the validated output through `transformer`, as `@remix-run/data-schema` does. */
    transform: <NewOutput>(
        transformer: (value: Output) => NewOutput,
    ) => ChainableSchema<Input, NewOutput>;
};

export type ReferenceSchema<C extends string = string> = ChainableSchema<string, Reference<C>>;

function createChainableSchema<Output>(
    run: (value: unknown, context: RunContext) => StandardSchemaV1.Result<Output>,
): ChainableSchema<string, Output> {
    let schema: ChainableSchema<string, Output> = {
        "~standard": {
            version: 1,
            vendor: "sprinkles",
            validate: value => run(value, { path: [] }),
        },
        "~run": run,
        pipe(..._checks) {
            return schema;
        },
        refine(_predicate, _message) {
            return schema;
        },
        transform(transformer) {
            return createChainableSchema((value, context) => {
                let result = run(value, context);
                if (result.issues) return result;
                return { value: transformer(result.value) };
            });
        },
    };

    return schema;
}

export function reference<C extends string>(collection: C): ReferenceSchema<C> {
    return createChainableSchema<Reference<C>>((value, context) => {
        if (typeof value !== "string") {
            let issue: StandardSchemaV1.Issue = { message: "Expected a string reference ID" };
            return {
                issues: [context.path.length > 0 ? { ...issue, path: context.path } : issue],
            };
        }
        return { value: { collection, id: value } };
    });
}
