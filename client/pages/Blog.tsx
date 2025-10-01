import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Content } from "@/lib/content";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const seed = [
  {
    slug: "observability-logs-to-insights",
    title: "Mastering Observability: From Logs to Insights",
    excerpt:
      "Turn noisy production logs into actionable insights using modern observability stacks.",
    tags: ["devops", "logs"],
    author: { name: "A. Debugger", avatar: "https://avatars.githubusercontent.com/u/1?v=4" },
    date: "2025-01-05",
    updated: "2025-01-12",
    readingTime: 8,
    reads: 2140,
  },
  {
    slug: "prompt-engineering-real-world",
    title: "Prompt Engineering for Real Developers",
    excerpt:
      "Practical patterns for integrating AI into your workflows without the hype.",
    tags: ["ai", "tools"],
    author: { name: "J. Builder", avatar: "https://avatars.githubusercontent.com/u/2?v=4" },
    date: "2025-01-22",
    updated: "2025-02-02",
    readingTime: 6,
    reads: 4620,
  },
  {
    slug: "nextjs-astro-bun-2025",
    title: "Next.js vs Astro vs Bun: 2025 Edition",
    excerpt:
      "We benchmark build speed, DX, and deployment ergonomics for modern stacks.",
    tags: ["web", "benchmark"],
    author: { name: "S. Kinetic", avatar: "https://avatars.githubusercontent.com/u/3?v=4" },
    date: "2025-02-10",
    updated: "2025-02-10",
    readingTime: 10,
    reads: 1290,
  },
];

type SortKey = "newest" | "most";

export default function Blog() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTag = params.get("tag") || "all";
  const initialQuery = params.get("q") || "";
  const [tag, setTag] = useState<string>(initialTag);
  const [sort, setSort] = useState<SortKey>("newest");
  const [search, setSearch] = useState(initialQuery);
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [articles, setArticles] = useState(() => {
    const custom = Content.getPosts();
    if (custom.length > 0) return custom;
    return seed.map((a) => ({
      ...a,
      author: { name: a.author.name, avatar: a.author.avatar },
    }));
  });

  useEffect(() => {
    const onUpdate = () => setArticles(Content.getPosts());
    window.addEventListener("bugchemy:content:update", onUpdate as any);
    return () => window.removeEventListener("bugchemy:content:update", onUpdate as any);
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // persist filters to URL
  useEffect(() => {
    const usp = new URLSearchParams(location.search);
    if (tag && tag !== "all") usp.set("tag", tag); else usp.delete("tag");
    if (q) usp.set("q", q); else usp.delete("q");
    window.history.replaceState({}, "", `${location.pathname}${usp.toString() ? `?${usp.toString()}` : ""}`);
  }, [tag, q, location.pathname, location.search]);

  const tags = useMemo(() => {
    const t = new Set<string>(["all"]);
    articles.forEach((a: any) => a.tags.forEach((x: string) => t.add(x)));
    return Array.from(t);
  }, [articles]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    let list = articles.filter((a: any) => {
      const matchesTag = tag === "all" || a.tags.includes(tag);
      const hay = `${a.title} ${a.excerpt} ${a.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !ql || hay.includes(ql);
      return matchesTag && matchesQuery;
    });
    if (sort === "newest") list = list.sort((a: any, b: any) => b.date.localeCompare(a.date));
    if (sort === "most") list = list.sort((a: any, b: any) => (b.reads ?? 0) - (a.reads ?? 0));
    return list;
  }, [tag, sort, articles, q]);

  const visible = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page]);
  const hasMore = visible.length < filtered.length;

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Bugchemy Blog",
      description: "Articles for developers: tools, debugging, DevOps, AI, and more.",
      blogPost: filtered.map((a: any) => ({
        "@type": "BlogPosting",
        headline: a.title,
        url: `/blog/${a.slug}`,
        datePublished: a.date,
        dateModified: a.updated,
        author: { "@type": "Person", name: a.author?.name ?? "Bugchemy" },
      })),
    }),
    [filtered],
  );

  return (
    <Layout>
      <SEO title="Bugchemy Blog" description="Deep-dive articles on tools, debugging, DevOps, AI, web, and more." jsonLd={jsonLd} />

      <section className="container px-4 py-10">
        <div className="mb-6">
          <div role="region" aria-label="Advertisement" className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
            Sponsored • Your ad here – reach developers on Bugchemy.
          </div>
        </div>
       
        {/* Filter bar */}
        <div className="sticky top-16 z-10 border-b backdrop-blur">
          <div className="py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col w-full gap-2 md:flex-row md:items-center md:gap-3 md:flex-1">
              {/* Search input (own row on small screens) */}
              <div className="w-full md:flex-1">
                <Input
                  placeholder="Search articles, tags…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              {/* Selects (side by side on small, inline on md+) */}
              <div className="flex w-full gap-2 md:w-auto md:flex-shrink-0">
                <select
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-w-0"
                  value={tag}
                  onChange={(e) => { setTag(e.target.value); setPage(1); }}
                  aria-label="Filter by tag"
                >
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All tags" : t}
                    </option>
                  ))}
                </select>
                <select
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-w-0"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                  aria-label="Sort"
                >
                  <option value="newest">Newest</option>
                  <option value="most">Most read</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pb-3 flex flex-wrap gap-2">
            {tags.filter((t) => t !== "all").map((t) => (
              <button
                key={t}
                onClick={() => { setTag(t === tag ? "all" : t); setPage(1); }}
                className={`rounded-full border px-3 py-1 text-xs ${t === tag ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>

        {/* Articles grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div role="region" aria-label="Advertisement" className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Sponsored • Promote your framework, tool, or course here.
          </div>
          {visible.map((a: any) => (
            <Link to={`/blog/${a.slug}`} key={a.slug} className="group">
              <Card className="overflow-hidden h-full hover:border-primary/40 transition-colors">
                {a.cover ? (
                  <AspectRatio ratio={16/9}>
                    <img src={a.cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </AspectRatio>
                ) : null}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {a.author?.avatar && (
                      <img src={a.author.avatar} alt="" className="h-5 w-5 rounded-full" loading="lazy" />
                    )}
                    <span>{a.author?.name ?? "Bugchemy"}</span>
                    <span>•</span>
                    <span>{new Date(a.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{a.readingTime} min read</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold group-hover:text-primary">{a.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {a.tags.map((t: string) => (
                      <Badge key={t} variant="secondary" className="bg-accent/15 text-accent capitalize">{t}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">No results. Try different keywords or tags.</p>
        )}

        {hasMore && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Load more</Button>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/newsletter"><Button>Subscribe for updates</Button></Link>
        </div>
      </section>
    </Layout>
  );
}
