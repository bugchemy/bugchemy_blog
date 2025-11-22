import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeExternalLinks from "rehype-external-links";
import CodeBlock from "@/components/CodeBlock";
import { cn } from "@/lib/utils";

export default function Markdown({ content }: { content: string }) {
  // Preprocess content to mark bracket highlights
  //const processedContent_temp = content.replace(
  //  /\[([^\[\]]+)\]/g,
  //  '<span class="bracket-highlight">[$1]</span>'
  //);

  let processedContent = content.replace(
    /(`)([^`\n]+)(`)/g,
    (_, _1, text) => `**${text.trim()}**`
  );

  processedContent = processedContent
    .replace(/(?<!\])\[(?!.*\]\()/g, '⟦')
    .replace(/\](?!\()/g, '⟧')
    .replace(/⟦([^⟦⟧]+)⟧/g, '**$1**');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSlug], [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }]]}
      allowHtml={true}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");
          if (inline) {
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap" {...props}>
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
          return (
            <pre className="bg-muted rounded-md p-4 overflow-x-auto my-4">
              {children}
            </pre>
          );
        },

        p({ children, className }) {
          // Avoid wrapping block-level code or pre elements inside <p>
          if (
            React.Children.toArray(children).some(
              (child: any) =>
                child?.type === "pre" ||
                child?.props?.className?.includes("code-block")
            )
          ) {
            return <>{children}</>; // <-- no <p> wrapper
          }

          return (
            <p className={cn("leading-7 mb-4", className)}>
              {children}
            </p>
          );
        },

        ul({ children, className }) {
          return (
            <ul className={cn("list-disc list-inside space-y-2 mb-4 ml-2", className)}>
              {children}
            </ul>
          );
        },
        ol({ children, className }) {
          return (
            <ol className={cn("list-decimal list-inside space-y-2 mb-4 ml-2", className)}>
              {children}
            </ol>
          );
        },
        li({ children, className }) {
          return (
            <li className={cn("", className)}>
              {children}
            </li>
          );
        },
        blockquote({ children, className }) {
          return (
            <blockquote className={cn("border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4", className)}>
              {children}
            </blockquote>
          );
        },
        h1({ children, className }) {
          return (
            <h1 className={cn("text-3xl font-bold mb-4 mt-6", className)}>
              {children}
            </h1>
          );
        },
        h2({ children, className }) {
          return (
            <h2 className={cn("text-2xl font-bold mb-3 mt-5", className)}>
              {children}
            </h2>
          );
        },
        h3({ children, className }) {
          return (
            <h3 className={cn("text-xl font-bold mb-3 mt-4", className)}>
              {children}
            </h3>
          );
        },
        h4({ children, className }) {
          return (
            <h4 className={cn("text-lg font-semibold mb-2 mt-3", className)}>
              {children}
            </h4>
          );
        },
        table({ children, className }) {
          return (
            <div className="overflow-x-auto my-4">
              <table className={cn("w-full border-collapse border border-border", className)}>
                {children}
              </table>
            </div>
          );
        },
        thead({ children, className }) {
          return (
            <thead className={cn("bg-muted", className)}>
              {children}
            </thead>
          );
        },
        tbody({ children, className }) {
          return (
            <tbody className={className}>
              {children}
            </tbody>
          );
        },
        tr({ children, className }) {
          return (
            <tr className={cn("border border-border", className)}>
              {children}
            </tr>
          );
        },
        th({ children, className }) {
          return (
            <th className={cn("border border-border px-3 py-2 font-semibold text-left", className)}>
              {children}
            </th>
          );
        },
        td({ children, className }) {
          return (
            <td className={cn("border border-border px-3 py-2", className)}>
              {children}
            </td>
          );
        },
        hr() {
          return <hr className="my-6 border-border" />;
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
