import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
// Register common languages lazily to reduce bundle
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import ruby from "highlight.js/lib/languages/ruby";
import php from "highlight.js/lib/languages/php";
import csharp from "highlight.js/lib/languages/csharp";
import cpp from "highlight.js/lib/languages/cpp";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("php", php);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("cpp", cpp);

export default function CodeBlock({ code, language }: { code: string; language?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const lang = language && hljs.getLanguage(language) ? language : undefined;
    ref.current.innerHTML = lang ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
  }, [code, language]);

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-xs">
        <span className="font-mono lowercase text-muted-foreground">{language || 'code'}</span>
        <button
          type="button"
          aria-label="Copy code"
          className="rounded-md border bg-background/70 px-2 py-1"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-card p-4 text-sm max-w-full"><code ref={ref} className={`hljs ${language || ''}`}/></pre>
    </div>
  );
}
