import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import "../styles.css";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "Content Layer × TanStack Start RSC" },
        ],
    }),
    component: RootComponent,
});

function RootComponent() {
    return (
        <html lang="en" className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
            <head>
                <HeadContent />
            </head>
            <body className="font-sans">
                <div className="mx-auto max-w-2xl p-6">
                    <Outlet />
                </div>
                <Scripts />
            </body>
        </html>
    );
}
