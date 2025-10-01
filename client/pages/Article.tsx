import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Markdown from "@/components/Markdown";
import { Content } from "@/lib/content";
import { useEffect, useMemo, useRef, useState } from "react";
import Comments from "@/components/Comments";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function extractHeadings(md: string) {
  const lines = md.split(/\n/);
  const headings: { depth: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (m) {
      const depth = m[1].length;
      const text = m[2].trim();
      const id = slugify(text);
      headings.push({ depth, text, id });
    }
  }
  return headings;
}

export default function Article() {
  const { slug } = useParams();
  const post = slug ? Content.getPostBySlug(slug) : undefined;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string | null>(null);

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        dateModified: post.updated,
        author: { "@type": "Person", name: post.author.name },
      }
    : undefined;

  const toc = useMemo(() => (post ? extractHeadings(post.content) : []), [post]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height;
      const scrolled = Math.min(Math.max(0, window.innerHeight - rect.top), total);
      setProgress(Math.max(0, Math.min(1, scrolled / total)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll as any);
  }, [contentRef.current]);

  useEffect(() => {
    if (!contentRef.current) return;
    const headings = Array.from(contentRef.current.querySelectorAll("h1, h2, h3")) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [post?.content]);

  const posts = Content.getPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? posts[idx - 1] : null;
  const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;

  return (
    <Layout>
      <SEO
        title={post ? post.title : `Article — ${slug}`}
        description={post?.excerpt || "Bugchemy article"}
        jsonLd={jsonLd}
      />
      <section className="container px-2 sm:px-4 py-6">
        {post ? (
          <>
            {/* Breadcrumbs */}
            <div className="mb-4 text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-x-1">
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link to="/blog" className="hover:text-primary">
                Blog
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground break-words">{post.title}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-border rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
            </div>

            {/* Layout grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Sidebar / TOC */}
              <aside className="order-last lg:order-none lg:col-span-3 w-full max-w-full break-words">
                <div className="sticky top-24 space-y-6">
                  {toc.length > 0 ? (
                    <nav
                      aria-label="Table of contents"
                      className="rounded-lg border p-4 text-sm break-words overflow-hidden"
                    >
                      <div className="text-xs font-medium text-muted-foreground mb-2">On this page</div>
                      <ul className="space-y-1">
                        {toc.map((h) => (
                          <li
                            key={h.id}
                            className={`${h.depth === 1 ? "" : h.depth === 2 ? "pl-3" : "pl-6"} truncate`}
                          >
                            <a
                              href={`#${h.id}`}
                              className={`hover:text-primary block ${
                                active === h.id ? "text-primary" : ""
                              }`}
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  ) : null}
                  <div
                    role="region"
                    aria-label="Advertisement"
                    className="rounded-lg border bg-card p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground text-center"
                  >
                    Sponsored • Tooling that accelerates debugging.
                  </div>
                </div>
              </aside>

              {/* Main article */}
              <article className="mx-auto max-w-full lg:max-w-3xl lg:col-span-9 px-1 sm:px-2">
                <header className="mb-6 sm:mb-8">
                  {post.cover ? (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={post.cover}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <h1 className="mt-4 sm:mt-6 text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight break-words">
                    {post.title}
                  </h1>
                  <div className="mt-2 text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-x-2">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.readingTime} min read</span>
                    <span>•</span>
                    <span>by {post.author.name}</span>
                  </div>
                </header>

                {/* Inline ad */}
                <div
                  role="region"
                  aria-label="Advertisement"
                  className="mb-6 rounded-lg border bg-card p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground text-center"
                >
                  Sponsored • Ship your product to thousands of devs.
                </div>

                {/* Blog content */}
                <div
                  ref={contentRef}
                  className="prose prose-slate dark:prose-invert max-w-full prose-code:font-mono prose-pre:bg-transparent prose-pre:overflow-x-auto break-words"
                >
                  <Markdown content={post.content} />
                </div>

                {/* Bottom ad */}
                <div
                  role="region"
                  aria-label="Advertisement"
                  className="mt-8 rounded-lg border bg-card p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground text-center"
                >
                  Sponsored • Ads can appear here.
                </div>

                {/* Share buttons */}
                <div className="mt-10 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                  >
                    Copy link
                  </Button>
                  <a
                    className="text-muted-foreground hover:text-primary"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      post.title
                    )}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Share on X
                  </a>
                  <a
                    className="text-muted-foreground hover:text-primary"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      window.location.href
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                </div>

                {/* Comments */}
                <Comments slug={post.slug} />

                {/* Related articles */}
                <section className="mt-10 sm:mt-12">
                  <h2 className="text-lg sm:text-xl font-semibold">Related articles</h2>
                  <div className="mt-4 flex gap-3 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible">
                    {Content.getPosts()
                      .filter((p) => p.slug !== post.slug)
                      .map((p) => ({
                        p,
                        score: p.tags.filter((t) => post.tags.includes(t)).length,
                      }))
                      .filter(({ score }) => score > 0)
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 6)
                      .map(({ p }) => (
                        <Link
                          key={p.id}
                          to={`/blog/${p.slug}`}
                          className="min-w-[85%] sm:min-w-0 snap-start rounded-lg border p-3 sm:p-4 hover:border-primary/40"
                        >
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(p.date).toLocaleDateString()} • {p.readingTime} min
                          </div>
                          <div className="font-medium mt-1 line-clamp-2 break-words">{p.title}</div>
                        </Link>
                      ))}
                  </div>
                </section>

                {/* Footer navigation */}
                <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex gap-2 text-xs sm:text-sm">
                    {prev ? (
                      <Link
                        to={`/blog/${prev.slug}`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        ← {prev.title}
                      </Link>
                    ) : (
                      <span />
                    )}
                    {next ? (
                      <Link
                        to={`/blog/${next.slug}`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {next.title} →
                      </Link>
                    ) : null}
                  </div>
                </footer>
              </article>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Not found</h1>
            <p className="mt-2 text-muted-foreground">We couldn’t find this article.</p>
          </div>
        )}
      </section>
    </Layout>
  );
}
