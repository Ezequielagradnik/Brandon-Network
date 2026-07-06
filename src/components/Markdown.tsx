"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-navy/85">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-5 mb-2 font-display text-2xl text-navy first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="mt-5 mb-2 font-display text-xl text-navy first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-4 mb-1.5 text-base font-semibold text-navy first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="my-2.5 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-2.5 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2.5 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-navy">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-navy/10" />,
          code: ({ children }) => (
            <code className="rounded bg-navy/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-navy">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <div className="my-3 flex gap-2.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-navy">
              <span className="shrink-0 text-base">💡</span>
              <div className="[&>p]:my-0 [&>p]:first:mt-0">{children}</div>
            </div>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-navy/10">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-navy/[0.04] text-left">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-medium text-navy/70">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-navy/[0.06] px-3 py-2 align-top text-navy/80">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
