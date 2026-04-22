import type { Action } from "remix/fetch-router";

export default (async () => {
    return new Response("remix-3 example — home OK", {
        headers: { "content-type": "text/plain; charset=utf-8" },
    });
}) satisfies Action<"GET", "/">;
