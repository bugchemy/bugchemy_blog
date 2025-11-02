import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { extractHeadings, Heading } from "../lib/utils";
import Markdown from "../components/Markdown";
import Comments from "../components/Comments";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import { LogoLoader } from "@/components/LogoLoader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Profile = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string | null;
  cover_url?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  profiles?: Profile | null;
  article_tags?: Array<{ tag_name: string }>;
  comments?: Array<any>;
  ai_summary?: string | null;
};

export default function Article(): JSX.Element {
  const { slug } = useParams<{ slug?: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<Heading[]>([]);

  // --- ADDED: handle AdSense load (optional)
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense initialization error", e);
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const { data: articleData, error: articleError } = await supabase
          .from("articles")
          .select(`
            id,
            title,
            slug,
            content,
            excerpt,
            cover_url,
            published_at,
            updated_at,
            created_at,
            profiles!articles_author_id_fkey(id, display_name, avatar_url),
            comments!comments_article_id_fkey(id, content, created_at, user_id, profiles!comments_user_id_fkey(id, display_name, avatar_url))
          `)
          .eq("slug", slug)
          .eq("status", "published")
          .eq("visibility", "public")
          .single();

        if (articleError || !articleData) {
          console.error("Error loading article:", articleError);
          setPost(null);
          setLoading(false);
          return;
        }

        const articleId = articleData.id;
         // --- Fetch article tags separately
        const { data: tagData, error: tagError } = await supabase
          .from("article_tags")
          .select("tags!article_tags_tag_id_fkey(name)")
          .eq("article_id", articleId);
        if (tagError) {
          console.error("Error loading tags:", tagError);
        }
        const tags = (tagData ?? []).map((t: any) => ({
          tag_name: t.tags.name,
        }));

        const { data: aiData } = await supabase
          .from("ai_jobs")
          .select("result_summary")
          .eq("article_id", articleId)
          .eq("status", "completed")
          .maybeSingle();

        const normalized: Post = {
          id: articleData.id,
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content ?? "",
          excerpt: articleData.excerpt ?? "",
          cover_url: articleData.cover_url ?? null,
          published_at: articleData.published_at ?? null,
          updated_at: articleData.updated_at ?? null,
          created_at: articleData.created_at ?? null,
          profiles: Array.isArray(articleData.profiles)
            ? articleData.profiles[0] ?? null
            : articleData.profiles ?? null,
          article_tags: tags,
          comments: (articleData.comments ?? []).map((c: any) => ({
            ...c,
            author: c.profiles
              ? { name: c.profiles.display_name, avatar: c.profiles.avatar_url }
              : null,
          })),
          ai_summary: aiData?.result_summary ?? null,
        };

        setPost(normalized);
        setHeadings(extractHeadings(normalized.content));

        const { data: relatedData } = await supabase
          .from("articles")
          .select("id, title, slug, excerpt, published_at")
          .neq("slug", slug)
          .eq("status", "published")
          .eq("visibility", "public")
          .limit(3)
          .order("published_at", { ascending: false });

        setRelated(relatedData || []);
      } catch (err) {
        console.error("Unexpected error loading article:", err);
        setPost(null);
      }

      setLoading(false);
    }

    load();
  }, [slug]);

  const authorName = post?.profiles?.display_name ?? "Bugchemy";

  const jsonLd = useMemo(() => {
    if (!post) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt ?? "",
      datePublished: post.published_at ?? post.created_at,
      dateModified: post.updated_at ?? post.created_at,
      author: { "@type": "Person", name: authorName },
    };
  }, [post, authorName]);

  if (loading)
    return <LogoLoader size="lg" text="Brewing your article..." speed={1} fullscreen />;
  if (!post)
    return (
      <Layout>
        <div className="p-8 text-center">Article not found</div>
      </Layout>
    );

  // --- ADDED: split article into two parts for mid-content ad
  const paragraphs = post.content?.split("\n\n") || [];
  const halfway = Math.floor(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, halfway).join("\n\n");
  const secondHalf = paragraphs.slice(halfway).join("\n\n");

  return (
    <Layout>
      {/* ---Dynamic DEO --- */}
      {post && (
      <SEO
        title={post.title}
        description={post.excerpt || post.ai_summary || ""}
        image={post.cover_url || "/bugchemy-og.svg"}
        url={`https://bugchemy.com/blog/${post.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt ?? "",
          image: post.cover_url ? [post.cover_url] : undefined,
          author: { "@type": "Person", name: authorName },
          publisher: {
            "@type": "Organization",
            name: "Bugchemy",
            logo: { "@type": "ImageObject", url: "https://bugchemy.com/logo.png" },
          },
          datePublished: post.published_at ?? post.created_at,
          dateModified: post.updated_at ?? post.created_at,
        }}
      />
    )}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,3fr)_1fr] gap-6 px-2 sm:px-4 py-10">
        {/* Left Ad */}
        <aside className="hidden lg:block sticky top-24 self-start">
          <Card className="p-4 text-sm text-muted-foreground text-center bg-card border">
            Sponsored
            <br />🚀 Promote your developer tool here!
          </Card>
        </aside>

        <article className="max-w-3xl mx-auto w-full">
          <h1 className="mb-4 text-4xl font-bold">{post.title}</h1>
          <div className="mb-6 text-sm text-gray-500 flex flex-wrap gap-2 items-center">
            {post.profiles?.avatar_url && (
              <img
                src={post.profiles.avatar_url}
                alt={authorName}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span>{authorName}</span>
            {post.published_at && (
              <span>• {new Date(post.published_at).toLocaleDateString()}</span>
            )}
          </div>

          {post.cover_url && (
            <img
              src={post.cover_url}
              alt={post.title}
              className="mb-6 rounded-lg w-full"
            />
          )}

          {post.ai_summary && (
            <div className="mb-6 border-l-4 border-primary bg-primary/5 p-4 rounded-md">
              <h2 className="font-semibold mb-2">Summary</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {post.ai_summary}
              </p>
            </div>
          )}

          {/* --- First half of article --- */}
          <Markdown content={firstHalf} />

          {/* --- Mid-Article Ad --- */}
          {paragraphs.length > 6 && (
            <section className="my-10">
              <Card className="p-4 sm:p-6 text-center bg-card border rounded-2xl shadow-sm">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  Sponsored
                </p>
                <a
                  href="https://your-ad-link.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://via.placeholder.com/728x90?text=Mid+Article+Ad"
                    alt="Advertisement"
                    className="rounded-md w-full sm:w-[728px] mx-auto"
                  />
                </a>
              </Card>
            </section>
          )}

          {/* --- Second half of article --- */}
          <Markdown content={secondHalf} />

          {post.article_tags && post.article_tags.length > 0 && (
            <div className="mt-6 flex gap-2 flex-wrap">
              {post.article_tags.map((t) => (
                <Badge
                  key={t.tag_name}
                  variant="secondary"
                  className="bg-accent/15 text-accent capitalize"
                >
                  {t.tag_name}
                </Badge>
              ))}
            </div>
          )}

          {/* --- Bottom Ad Section --- */}
          <section className="my-10">
            <Card className="p-4 sm:p-6 text-center bg-card border rounded-2xl shadow-sm">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Sponsored
              </p>
              <a
                href="https://another-ad-link.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://via.placeholder.com/728x90?text=Bottom+Ad"
                  alt="Advertisement"
                  className="rounded-md w-full sm:w-[728px] mx-auto"
                />
              </a>
              <p className="mt-3 text-xs text-muted-foreground sm:hidden">
                Promote your brand — <a href="/contact" className="underline">Contact us</a>
              </p>
            </Card>
          </section>

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="font-semibold text-lg mb-4">Related Articles</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {related.map((a) => (
                  <Link key={a.id} to={`/blog/${a.slug}`}>
                    <Card className="hover:border-primary transition-colors p-4">
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {a.excerpt}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10">
            <Comments articleId={post.id} />
          </div>
        </article>

        {/* Right Ad */}
        <aside className="hidden lg:block sticky top-24 self-start">
          <Card className="p-4 text-sm text-muted-foreground text-center bg-card border">
            Sponsored
            <br />💡 Reach 50k+ devs with your tool!
          </Card>
        </aside>
      </div>
    </Layout>
  );
}
