import { isRouteErrorResponse, Links, Meta, Outlet, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";

import "./app.css";

export function ServerLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Content Layer × React Router RSC</title>
                <Meta />
                <Links />
            </head>
            <body className="font-sans">
                <div className="mx-auto max-w-2xl p-6">{children}</div>
                <ScrollRestoration />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}

export function ServerErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main>
            <h1 className="text-2xl font-bold">{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="overflow-x-auto p-4">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
