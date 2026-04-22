import { get, route } from "remix/fetch-router/routes";

export let routes = route({
    home: get("/"),
    post: get("/blog/:slug"),
});
