import { expect, test } from "vite-plus/test";

import { generateDigest } from "./digest.ts";

test("generates consistent digest for the same string", () => {
    let a = generateDigest("hello");
    let b = generateDigest("hello");
    expect(a).toBe(b);
});

test("generates different digests for different strings", () => {
    let a = generateDigest("hello");
    let b = generateDigest("world");
    expect(a).not.toBe(b);
});

test("generates digest from object by JSON stringifying", () => {
    let a = generateDigest({ foo: "bar" });
    let b = generateDigest(JSON.stringify({ foo: "bar" }));
    expect(a).toBe(b);
});
