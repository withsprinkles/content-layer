import { expect, test } from "vite-plus/test";

import { generateTypes } from "./codegen.ts";

test("generates module declaration for sprinkles:content", () => {
    let output = generateTypes(
        { blog: { schema: null as never } },
        "../../app/content.config.ts",
        'import("react").ComponentType',
    );
    expect(output).toContain('declare module "sprinkles:content"');
});

test("generates ContentEntryMap with collection entries", () => {
    let output = generateTypes(
        {
            blog: { schema: null as never },
            authors: { schema: null as never },
        },
        "../../app/content.config.ts",
        'import("react").ComponentType',
    );
    expect(output).toContain("blog:");
    expect(output).toContain("authors:");
    expect(output).toContain("ContentEntryMap");
});

test("inlines schema output extraction without depending on @standard-schema/spec", () => {
    let output = generateTypes(
        { blog: { schema: null as never } },
        "../../app/content.config.ts",
        'import("react").ComponentType',
    );
    expect(output).toContain("_InferSchemaOutput");
    expect(output).toContain('"~standard"');
    expect(output).not.toContain("@standard-schema/spec");
});

test("uses adapter componentType in render return type", () => {
    let output = generateTypes(
        { blog: { schema: null as never } },
        "../../app/content.config.ts",
        '() => () => import("remix/component").RemixNode',
    );
    expect(output).toContain('() => () => import("remix/component").RemixNode');
});

test("includes typed function signatures", () => {
    let output = generateTypes(
        { blog: { schema: null as never } },
        "../../app/content.config.ts",
        'import("react").ComponentType',
    );
    expect(output).toContain("export function getCollection");
    expect(output).toContain("export function getEntry");
    expect(output).toContain("export function getEntries");
    expect(output).toContain("export function render");
    expect(output).toContain("export function defineCollection");
    expect(output).toContain("export function reference");
});

test("references config path for collection types", () => {
    let output = generateTypes(
        { blog: { schema: null as never } },
        "../../app/content.config.ts",
        'import("react").ComponentType',
    );
    expect(output).toContain('typeof import("../../app/content.config.ts").collections');
});
