import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react"; 
import { Link } from "react-router-dom";

import { supabase } from "@/lib/supabaseClient"; 

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  Card,
  CardTitleWithTooltip,
  CardDescriptionWithTooltip 
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { LogoLoader } from "@/components/LogoLoader";

export default function Index() {
  // Featured Articles State
  const [featured, setFeatured] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagsLookup, setTagsLookup] = useState<{ [id: number]: string }>({});

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Bugchemy",
      url: "/",
      description:
        "Bugchemy is a developer-centric learning blog exploring tools, frameworks, debugging, and real-world tech insights.",
      inLanguage: "en-US",
    }),
    []
  );

  // Fetch Categories (tags)
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, excerpt, icon");

      if (error) {
        console.error("Error fetching tags:", error);
      } else {
        setCategories(data || []);
        // create lookup map for tag ID → name
        const lookup: { [id: number]: string } = {};
        (data || []).forEach((t) => {
          lookup[t.id] = t.name;
        });
        setTagsLookup(lookup);
      }
      setLoading(false);
    };

    fetchTags();
  }, []);

  // Fetch Featured Articles
  useEffect(() => {
    const fetchFeatured = async () => {
      setLoadingFeatured(true);

      const { data, error } = await supabase
        .from("featured_articles")
        .select(`
          article_id,
          articles!inner(
            id, slug, title, excerpt,
            published_at, updated_at,
            articles_author_id_fkey!inner(display_name, avatar_url),
            article_tags_article_id_fkey!inner(tag_id)
          )
        `);

      if (error) {
        console.error("Error fetching featured articles:", error);
        setFeatured([]);
      } else {
        const normalized = (data || []).map((f: any) => {
          const article = f.articles;
          return {
            id: article.id,
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt,
            cover_url: article.cover_url ?? undefined,
            // ✅ Map tag IDs to tag names using lookup
            tags: (article.article_tags_article_id_fkey || []).map(
              (t: any) => tagsLookup[t.tag_id] || t.tag_id
            ),
            author: {
              name: article.articles_author_id_fkey?.display_name ?? "Bugchemy",
              avatar: article.articles_author_id_fkey?.avatar_url ?? undefined,
            },
            date: article.published_at,
            updated: article.updated_at,
            readingTime: Math.ceil((article.excerpt?.length ?? 1000) / 1000) * 2,
          };
        });
        setFeatured(normalized);
      }

      setLoadingFeatured(false);
    };

    fetchFeatured();
  }, [tagsLookup]); // 🔹 depend on tagsLookup so IDs are mapped to names

  return (
    <Layout>
      <SEO
        title="Bugchemy — Experiment. Learn. Evolve."
        description="A modern, developer-centric learning blog exploring tools, frameworks, debugging, and real-world tech insights."
        jsonLd={jsonLd}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container grid gap-8 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/favicon-96x96.png"
                alt="Bugchemy"
                className="h-10 w-10"
              />
              <Badge
                className="bg-primary/15 text-primary"
                variant="secondary"
              >
                Experiment. Learn. Evolve.
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Debug better. Build faster. Learn continuously.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-prose">
              Bugchemy blends curiosity with hands-on experimentation—covering
              tools, frameworks, debugging methods, and real-world insights for
              developers and support engineers.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/blog">
                <Button className="shadow-lg">Read the Blog</Button>
              </Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden">
              <div className="absolute inset-0 grid place-items-center p-6">
                <img
                  src="/web-app-manifest-192x192.png"
                  alt="Bugchemy logo"
                  className="max-h-full max-w-full object-contain opacity-90"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="container py-8 md:py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Featured Articles</h2>
          <Link to="/blog" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="relative">
          <Carousel>
            <CarouselContent>
              {loadingFeatured ? (
                <div className="py-20 text-center w-full">
                  <LogoLoader />
                </div>
              ) : featured.length === 0 ? (
                <div className="py-20 text-center w-full">
                  No featured articles found
                </div>
              ) : (
                featured.map((a) => (
                  <CarouselItem key={a.slug} className="md:basis-1/2 lg:basis-1/3">
                    <Link to={`/blog/${a.slug}`} className="block h-full">
                      <Card className="overflow-hidden hover:border-primary/40 transition-colors">
                        {a.cover_url && (
                          <AspectRatio ratio={16 / 9}>
                            <img
                              src={a.cover_url}
                              alt={a.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </AspectRatio>
                        )}
                        {/** */}
                        <div className={`p-5 ${!a.cover_url ? "pt-3" : ""}`}>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {/** Do not change commented code */}
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
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* ✅ Dynamic Categories Section */}
      <section className="container py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Explore Categories</h2>

        {loading ? (
          <p className="text-muted-foreground">Loading categories...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Link to={`/blog?tag=${encodeURIComponent(c.name)}`} key={c.id}>
                <Card className="p-5 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    {c.icon ? (
                      <Icon icon={c.icon} className="text-2xl text-primary" />
                    ) : (
                      <span className="text-2xl">🧩</span>
                    )}
                    <div>
                      <h3 className="font-semibold hover:text-primary">
                        {c.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {c.excerpt || "Articles, guides, and lab notes"}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="container py-12">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-8 md:p-10">
          <div className="max-w-2xl">
            <h3 className="text-xl md:text-2xl font-bold">
              Join Bugchemy Lab Notes
            </h3>
            <p className="mt-2 text-muted-foreground">
              Monthly tips, tools, and experiments. No spam—only signal.
            </p>
            <form
              className="mt-6 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => e.preventDefault()}
              disabled
            >
              <input
                type="email"
                required
                placeholder="you@devmail.com"
                className="flex-1 rounded-md border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" disabled>Subscribe</Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
