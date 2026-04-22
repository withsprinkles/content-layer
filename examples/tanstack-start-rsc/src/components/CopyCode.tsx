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
        <div className="relative my-4 overflow-hidden rounded-md bg-slate-900 text-slate-100">
            <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
                {copied ? "Copied!" : "Copy"}
            </button>
            <pre className="overflow-x-auto p-4 pr-20 font-normal text-sm">
                <code className={lang ? `language-${lang}` : undefined}>{children.trim()}</code>
            </pre>
        </div>
    );
}
