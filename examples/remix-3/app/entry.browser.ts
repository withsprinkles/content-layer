import { run } from "remix/ui";

run({
    async loadModule(moduleUrl, exportName) {
        let mod = await import(/* @vite-ignore */ moduleUrl);
        return mod[exportName];
    },
    async resolveFrame(src, options) {
        let headers = new Headers({ accept: "text/html" });
        if (options?.target) headers.set("x-remix-frame", options.target);
        let response = await fetch(src, { headers, signal: options?.signal });
        return response.body ?? (await response.text());
    },
});
