import { run } from "remix/component";

run({
    async loadModule(moduleUrl, exportName) {
        let mod = await import(/* @vite-ignore */ moduleUrl);
        return mod[exportName];
    },
    async resolveFrame(src, signal, target) {
        let headers = new Headers({ accept: "text/html" });
        if (target) headers.set("x-remix-frame", target);
        let response = await fetch(src, { headers, signal });
        return response.body ?? (await response.text());
    },
});
