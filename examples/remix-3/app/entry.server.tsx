import home from "#/controllers/home.tsx";
import post from "#/controllers/post.tsx";
import { routes } from "#/routes.ts";
import { asyncContext } from "remix/middleware/async-context";
import { staticFiles } from "remix/middleware/static";
import { createRouter } from "remix/router";

export let router = createRouter({
    middleware: [staticFiles("./dist/client"), asyncContext()],
});

router.map(routes.home, home);
router.map(routes.post, post);

export default router;

if (import.meta.hot) {
    import.meta.hot.accept();
}
