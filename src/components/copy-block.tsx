"use client";

import { useState } from "react";

type CopyBlockProps = {
  title: string;
  content: string;
};

export function CopyBlock({ title, content }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{title}</h4>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-200">
        {content}
      </pre>
    </div>
  );
}
