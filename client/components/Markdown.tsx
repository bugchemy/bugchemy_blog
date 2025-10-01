import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeExternalLinks from "rehype-external-links";
import CodeBlock from "@/components/CodeBlock";

export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSlug], [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }]]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");
          if (inline) {
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          }
          return <CodeBlock code={code} language={match?.[1]} />;
        },
        a({ children, ...props }) {
          return (
            <a className="text-primary underline underline-offset-4" {...props}>
              {children}
            </a>
          );
        },
        pre({ children }) {
          return <>{children}</>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
