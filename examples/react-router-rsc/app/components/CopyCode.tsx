"use client";

import { useState } from "react";

export function CopyCode({ lang, children }: { lang?: string; children: string }) {
    let [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(children.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="relative my-4 overflow-hidden rounded-md bg-gray-950 text-gray-50">
            <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
            >
                {copied ? "Copied!" : "Copy"}
            </button>
            <pre className="overflow-x-auto p-4 pr-20">
                <code className={lang ? `language-${lang}` : undefined}>
                    {children.trim()}
                </code>
            </pre>
        </div>
    );
}
