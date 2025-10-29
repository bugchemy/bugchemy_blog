import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitleWithTooltip, CardDescriptionWithTooltip } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { LogoLoader } from "@/components/LogoLoader";

type SortKey = "newest" | "most";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  tags: string[];
  author?: { name: string; avatar?: string };
  date?: string;
  updated?: string;
  readingTime?: number;
  reads?: number;
  cover_url?: string;
}

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
  const pageSize = 20;

  const [articles, setArticles] = useState<Article[]>([]);
  const [tagsData, setTagsData] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // ✅ Fetch all tags from DB
  useEffect(() => {
    async function fetchTags() {
      const { data, error } = await supabase.from("tags").select("id, name");
      if (error) console.error("Error loading tags:", error);
      else setTagsData(data || []);
    }
    fetchTags();
  }, []);

  // 🔹 Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // 🔹 Persist filters in URL
  useEffect(() => {
    const usp = new URLSearchParams(location.search);
    if (tag && tag !== "all") usp.set("tag", tag); else usp.delete("tag");
    if (q) usp.set("q", q); else usp.delete("q");
    window.history.replaceState({}, "", `${location.pathname}${usp.toString() ? `?${usp.toString()}` : ""}`);
    setPage(1); // reset page when filters/search change
  }, [tag, q, location.pathname]);

  // ✅ Fetch articles from Supabase
  useEffect(() => {
    if (!tagsData.length) return; // wait until tags are loaded
    setLoading(true);

    async function fetchArticles() {
      let query = supabase
        .from("articles")
        .select(`
          id,
          slug,
          title,
          excerpt,
          cover_url,
          published_at,
          updated_at,
          articles_author_id_fkey!inner(id, display_name, avatar_url),
          article_tags_article_id_fkey!inner(tag_id)
        `)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("published_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // 🔹 Filter by tag
      if (tag !== "all") {
        const tagObj = tagsData.find((t) => t.name === tag);
        if (tagObj) {
          query = query.eq("article_tags_article_id_fkey.tag_id", Number(tagObj.id));
        }
      }

      // 🔹 Search by query
      if (q) {
        const like = `%${q}%`;
        query = query.or(`title.ilike.${like},excerpt.ilike.${like}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading articles:", error);
        setArticles([]);
        setHasMore(false);
      } else {
        const normalized: Article[] = (data || []).map((a: any) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt ?? "",
          tags: (a.article_tags_article_id_fkey || []).map((t: any) => {
            const tag = tagsData.find((tag) => tag.id === t.tag_id);
            return tag?.name ?? "";
          }),
          author: {
            name: a.articles_author_id_fkey?.display_name ?? "Bugchemy",
            avatar: a.articles_author_id_fkey?.avatar_url ?? undefined,
          },
          date: a.published_at,
          updated: a.updated_at,
          readingTime: Math.ceil((a.excerpt?.length ?? 1000) / 1000) * 2,
          reads: Math.floor(Math.random() * 3000),
          cover_url: a.cover_url ?? undefined,
        }));

        if (page === 1) setArticles(normalized);
        else setArticles((prev) => [...prev, ...normalized]);

        setHasMore((data?.length ?? 0) === pageSize);
      }

      setLoading(false);
    }

    fetchArticles();
  }, [tag, q, page, sort, tagsData]);

  const loadMore = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  // 🔹 Sort in frontend
  const visible = useMemo(() => {
    let list = [...articles];
    if (sort === "newest") list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (sort === "most") list.sort((a, b) => (b.reads ?? 0) - (a.reads ?? 0));
    return list;
  }, [articles, sort]);

  // 🔹 Dropdown tags: always show all DB tags
  const tags = useMemo(() => {
    return ["all", ...tagsData.map((t) => t.name)];
  }, [tagsData]);

  return (
    <Layout>
      <SEO
        title="Bugchemy Blog"
        description="Deep-dive articles on tools, debugging, DevOps, AI, web, and more."
      />

      <section className="container px-4 py-10">
        {/* Filter bar */}
        <div className="sticky top-16 z-10 border-b backdrop-blur">
          <div className="py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col w-full gap-2 md:flex-row md:items-center md:gap-3 md:flex-1">
              <div className="w-full md:flex-1">
                <Input
                  placeholder="Search articles, tags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex w-full gap-2 md:w-auto md:flex-shrink-0">
                <select
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-w-0"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
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
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort"
                >
                  <option value="newest">Newest</option>
                  <option value="most">Most read</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Article Grid */}
        {/* Article Grid */}
        {loading && page === 1 ? (
          <div className="flex justify-center py-20">
            <LogoLoader />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">No related articles found.</p>
            <p className="text-sm mt-1">Try adjusting your search or selecting a different tag.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((a) => (
              <Link to={`/blog/${a.slug}`} key={a.slug + a.id} className="group">
                <Card className="overflow-hidden hover:border-primary/40 transition-colors">
                  {a.cover_url && (
                    <AspectRatio ratio={16 / 9}>
                      <img
                        src={a.cover_url}
                        alt={a.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </AspectRatio>
                  )}
                  <div className={`p-5 ${!a.cover_url ? "pt-3" : ""}`}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {a.author?.avatar && (
                        <img
                          src={a.author.avatar}
                          alt=""
                          className="h-5 w-5 rounded-full"
                          loading="lazy"
                        />
                      )}
                      <span>{a.author?.name ?? "Bugchemy"}</span>
                      <span>•</span>
                      <span>{a.date ? new Date(a.date).toLocaleDateString() : ""}</span>
                      <span>•</span>
                      <span>{a.readingTime} min read</span>
                    </div>
                    <CardTitleWithTooltip
                      text={a.title}
                      limit={50}
                      className="mt-3 group-hover:text-primary"
                    />
                    <CardDescriptionWithTooltip
                      text={a.excerpt ?? ""}
                      limit={50}
                      className="mt-2 line-clamp-3"
                    />
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {a.tags.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="bg-accent/15 text-accent capitalize"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}


        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <Button onClick={loadMore}>Load more</Button>
          </div>
        )}
      </section>
    </Layout>
  );
}
