import { z } from "zod";

export const SnippetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Snippet = z.infer<typeof SnippetSchema>;

export const PostSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  author: z.object({ name: z.string(), avatar: z.string().optional() }),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  content: z.string().min(1), // Markdown
  date: z.string(),
  updated: z.string(),
  readingTime: z.number().int().positive(),
  reads: z.number().int().nonnegative().default(0),
});
export type Post = z.infer<typeof PostSchema>;

const KEY = "bugchemy.content.v1";

export type ContentDB = {
  posts: Post[];
  snippets: Snippet[];
};

function read(): ContentDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { posts: [], snippets: [] };
    const parsed = JSON.parse(raw) as ContentDB;
    if (!parsed.posts) parsed.posts = [];
    if (!parsed.snippets) parsed.snippets = [];
    return parsed;
  } catch {
    return { posts: [], snippets: [] };
  }
}

function write(db: ContentDB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent("bugchemy:content:update"));
}

export const Content = {
  all(): ContentDB {
    return read();
  },
  clear() {
    write({ posts: [], snippets: [] });
  },
  import(db: ContentDB) {
    write(db);
  },
  export(): ContentDB {
    return read();
  },
  // Posts
  getPosts(): Post[] {
    return read().posts;
  },
  getPostBySlug(slug: string): Post | undefined {
    return read().posts.find((p) => p.slug === slug);
  },
  upsertPost(post: Omit<Post, "id" | "readingTime" | "reads" | "date" | "updated"> & { id?: string; date?: string; updated?: string; reads?: number; }): Post {
    const db = read();
    const now = new Date().toISOString();
    const id = post.id ?? crypto.randomUUID();
    const existingIdx = db.posts.findIndex((p) => p.id === id || p.slug === post.slug);
    const rt = Math.max(1, Math.round(post.content.split(/\s+/).length / 200));
    const newPost: Post = {
      id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      author: post.author,
      tags: post.tags ?? [],
      cover: post.cover,
      content: post.content,
      date: post.date ?? now,
      updated: now,
      readingTime: rt,
      reads: post.reads ?? (existingIdx >= 0 ? db.posts[existingIdx].reads : 0),
    };
    if (existingIdx >= 0) db.posts[existingIdx] = newPost; else db.posts.unshift(newPost);
    write(db);
    return newPost;
  },
  deletePost(id: string) {
    const db = read();
    db.posts = db.posts.filter((p) => p.id !== id);
    write(db);
  },
  // Snippets
  getSnippets(): Snippet[] {
    return read().snippets;
  },
  upsertSnippet(snippet: Omit<Snippet, "id" | "createdAt" | "updatedAt"> & { id?: string }): Snippet {
    const db = read();
    const now = new Date().toISOString();
    const id = snippet.id ?? crypto.randomUUID();
    const idx = db.snippets.findIndex((s) => s.id === id);
    const rec: Snippet = { id, name: snippet.name, language: snippet.language, code: snippet.code, createdAt: idx>=0? db.snippets[idx].createdAt : now, updatedAt: now };
    if (idx>=0) db.snippets[idx] = rec; else db.snippets.unshift(rec);
    write(db);
    return rec;
  },
  deleteSnippet(id: string) {
    const db = read();
    db.snippets = db.snippets.filter((s) => s.id !== id);
    write(db);
  },
  ensureSeed() {
    const db = read();
    if (db.posts.length > 0) return;
    const now = new Date();
    const posts = [
      {
        slug: "java-microservices-logs-traces",
        title: "Debugging Java Microservices with Logs and Traces",
        excerpt:
          "A practical guide to troubleshooting JVM services using structured logs, OpenTelemetry traces, and production‑safe techniques.",
        author: { name: "Bugchemy Team" },
        tags: ["java", "devops", "logs"],
        cover: undefined,
        content: `# Debugging Java Microservices with Logs and Traces\n\nWhen JVM services misbehave in production, pair structured logs with distributed traces.\n\n## Log structure\n\n\n\`\`\`java\nlogger.info("userLogin", Map.of(\n  "userId", userId,\n  "ip", request.getRemoteAddr(),\n  "session", session.getId()\n));\n\ntry {\n  service.process(order);\n} catch (Exception e) {\n  logger.error("orderFailure", Map.of("orderId", order.id()), e);\n}\n\n\`\`\`\n\n## Trace context propagation\n\n\`\`\`java\n// io.opentelemetry:opentelemetry-api\ntry (var span = tracer.spanBuilder("charge").startScopedSpan()) {\n  payment.charge(request);\n}\n\n\`\`\`\n\nTip: Correlate trace id in both logs and traces for instant pivoting.`,
      },
      {
        slug: "python-pipelines-from-logs-to-insights",
        title: "Python Data Pipelines: From Logs to Insights",
        excerpt:
          "Process TB‑scale logs with Python + DuckDB/Polars to surface KPIs in minutes.",
        author: { name: "Bugchemy Team" },
        tags: ["python", "analytics", "logs"],
        cover: undefined,
        content: `# Python Pipelines: Logs → Insights\n\nUse **Polars** for fast transforms and **DuckDB** for SQL.\n\n\`\`\`python\nimport polars as pl\n\nlogs = pl.read_ndjson("prod-logs.ndjson")\nerrors = logs.filter(pl.col("level") == "error")\nby_service = errors.group_by("service").agg(pl.len().alias("count")).sort("count", descending=True)\nprint(by_service)\n\n\`\`\`\n\nEmbed charts or ship to a dashboard system.`,
      },
      {
        slug: "shell-scripting-incident-response",
        title: "Shell Scripting for Incident Response",
        excerpt:
          "Battle‑tested bash snippets to gather diagnostics safely during incidents.",
        author: { name: "Bugchemy Team" },
        tags: ["bash", "linux", "devops"],
        cover: undefined,
        content: `# Shell Scripting for Incident Response\n\nMinimal, safe commands.\n\n\`\`\`bash\n#!/usr/bin/env bash\nset -euo pipefail\n\nTS=$(date +%Y%m%d-%H%M%S)\nmkdir -p diag-$TS && cd diag-$TS\n\n# CPU/mem snapshot\nps aux --sort=-%mem | head -n 25 > processes.txt\nfree -h > memory.txt\n\n# Top 50 error lines from today\ngrep -i "error" /var/log/app.log | tail -n 50 > recent-errors.txt\n\necho "Saved diagnostics to $(pwd)"\n\n\`\`\``,
      },
      {
        slug: "shell-scripting-for-incident-response",
        title: "Shell Scripting for Incident Response",
        excerpt:
          "Battle‑tested bash snippets to gather diagnostics safely during incidents.",
        author: { name: "Bugchemy Team" },
        tags: ["bash", "linux", "devops"],
        cover: undefined,
        content: `# Shell Scripting for Incident Response\n\nMinimal, safe commands.\n\n\`\`\`bash\n#!/usr/bin/env bash\nset -euo pipefail\n\nTS=$(date +%Y%m%d-%H%M%S)\nmkdir -p diag-$TS && cd diag-$TS\n\n# CPU/mem snapshot\nps aux --sort=-%mem | head -n 25 > processes.txt\nfree -h > memory.txt\n\n# Top 50 error lines from today\ngrep -i "error" /var/log/app.log | tail -n 50 > recent-errors.txt\n\necho "Saved diagnostics to $(pwd)"\n\n\`\`\``,
      },
    ];
    posts.forEach((p, i) =>
      Content.upsertPost({ ...p, date: new Date(now.getTime() - i * 86400000).toISOString() })
    );
  },
};
