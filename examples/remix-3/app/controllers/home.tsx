import type { Action } from "remix/fetch-router";

import { Document } from "#/components/Document.tsx";
import { document, frame } from "#/lib/render.tsx";

export default (async ctx => {
    if (ctx.headers.get("x-remix-frame") === "content") {
        return frame(<p>Home</p>);
    }
    return document(<Document />);
}) satisfies Action<"GET", "/">;
