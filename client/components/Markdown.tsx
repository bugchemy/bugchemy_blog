import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeExternalLinks from "rehype-external-links";
import { Components, ExtraProps } from "react-markdown";
import { Copy } from "lucide-react";
import hljs from "highlight.js";

// Import highlight.js themes
import "highlight.js/styles/github.css";
import "highlight.js/styles/github-dark.css";

type CodeProps = {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
} & ExtraProps;

export default function Markdown({ content }: { content: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Convert escaped "\n" to actual newlines (for AI / JSON inputs)
  const normalizedContent = content.replace(/\\n/g, "\n");

  const handleCopy = async (code: string, button: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(code);
      const original = button.innerText;
      button.innerText = "Copied!";
      button.classList.add("text-green-500");
      setTimeout(() => {
        button.innerText = original;
        button.classList.remove("text-green-500");
      }, 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const components: Components = {
    code({ inline, className, children, ...props }: CodeProps) {
      const rawCode = String(children).replace(/\n$/, "");
      const language = /language-(\w+)/.exec(className || "")?.[1];

      if (inline) {
        return (
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
            {children}
          </code>
        );
      }

      // ✅ Highlight manually using highlight.js
      const highlighted = language
        ? hljs.highlight(rawCode, { language }).value
        : hljs.highlightAuto(rawCode).value;

      return (
        <div className="relative group my-4">
          <button
            onClick={(e) => handleCopy(rawCode, e.currentTarget)}
            className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-background/80 dark:bg-zinc-800/80 text-xs px-2 py-1 rounded-md border border-border hover:bg-muted/60 transition-all"
          >
            <Copy size={14} />
            Copy
          </button>
          <pre
            className={`overflow-x-auto rounded-lg border ${
              isDark ? "bg-[#0d1117]" : "bg-[#f6f8fa]"
            }`}
          >
            <code
              className={`hljs language-${language || "plaintext"}`}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    },
  };

  return (
    <div
      className={`prose max-w-none ${
        isDark ? "prose-invert" : ""
      } transition-colors duration-300`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
        ]}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
