import { expect, test } from "vite-plus/test";

import { defineCollection, reference } from "./index.ts";

test("defineCollection is a passthrough", () => {
    let input = {
        loader: { name: "test", load: async () => {}, schema: null as never },
        schema: { "~standard": { version: 1, vendor: "test", validate: () => ({ value: {} }) } },
    };
    let result = defineCollection(input as any);
    expect(result).toBe(input);
});

test("reference validates string input and returns collection/id object", async () => {
    let schema = reference("authors");
    let result = await schema["~standard"].validate("mark");
    expect(result).toEqual({ value: { collection: "authors", id: "mark" } });
});

test("reference returns issues for non-string input", async () => {
    let schema = reference("authors");
    let result = await schema["~standard"].validate(42);
    expect(result).toHaveProperty("issues");
    if ("issues" in result && result.issues) {
        expect(result.issues[0].message).toBe("Expected a string reference ID");
    }
});

test("reference has correct ~standard metadata", () => {
    let schema = reference("authors");
    expect(schema["~standard"].version).toBe(1);
    expect(schema["~standard"].vendor).toBe("sprinkles");
});
