import home from "#/controllers/home.tsx";
import { asyncContext } from "remix/async-context-middleware";
import { createRouter } from "remix/fetch-router";
import { staticFiles } from "remix/static-middleware";

export let router = createRouter({
    middleware: [staticFiles("./dist/client"), asyncContext()],
});

router.get("/", home);

export default router;

if (import.meta.hot) {
    import.meta.hot.accept();
}
