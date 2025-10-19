import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LogoLoader } from "@/components/LogoLoader";

interface Article {
  id: string;
  slug: string;
  title: string;
  content?: string;
  excerpt?: string;
  tags: string[];
  author?: { name: string; avatar?: string };
  date?: string;
  updated?: string;
  readingTime?: number;
  reads?: number;
  cover_url?: string;
  status?: "draft" | "published";
  visibility?: "public" | "private";
}

export default function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tagsData, setTagsData] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [slug, setSlug] = useState("");

  // Editor state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  // Tag search & dynamic handling
  const [tagSearch, setTagSearch] = useState("");
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([]);

  // Article search
  const [articleSearch, setArticleSearch] = useState("");

  // Fetch all tags
  useEffect(() => {
    async function fetchTags() {
      const { data, error } = await supabase.from("tags").select("id, name");
      if (error) console.error("Error fetching tags:", error);
      else setAvailableTags(data || []);
    }
    fetchTags();
  }, []);

  // Fetch articles (with search)
  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      let query = supabase
        .from("articles")
        .select(`
          id,
          slug,
          title,
          content,
          excerpt,
          cover_url,
          status,
          visibility,
          published_at,
          updated_at,
          article_tags_article_id_fkey!inner(tag_id)
        `)
        .order("published_at", { ascending: false });

      if (articleSearch.trim()) {
        query = query.ilike("title", `%${articleSearch}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching articles:", error);
        setArticles([]);
      } else {
        const normalized: Article[] = (data || []).map((a: any) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          content: a.content ?? "",
          excerpt: a.excerpt ?? "",
          tags: (a.article_tags_article_id_fkey || []).map((t: any) => {
            const tag = availableTags.find(tag => tag.id === t.tag_id);
            return tag?.name ?? "";
          }),
          cover_url: a.cover_url ?? "",
          status: a.status ?? "draft",
          visibility: a.visibility ?? "public",
          date: a.published_at,
          updated: a.updated_at,
        }));
        setArticles(normalized);
      }
      setLoading(false);
    }

    fetchArticles();
  }, [availableTags, articleSearch]);

  const resetEditor = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setContent("");
    setExcerpt("");
    setCover("");
    setTags([]);
    setStatus("draft");
    setVisibility("public");
    setTagSearch("");
    setEditorExpanded(false);
  };

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleAddTag = async () => {
    const newTagName = tagSearch.trim();
    if (!newTagName || tags.includes(newTagName)) return;

    let tag = availableTags.find(t => t.name.toLowerCase() === newTagName.toLowerCase());
    if (!tag) {
      const { data: newTag } = await supabase
        .from("tags")
        .insert({ name: newTagName })
        .select()
        .single();
      if (newTag) {
        tag = newTag;
        setAvailableTags(prev => [...prev, newTag]);
      }
    }

    if (tag && !tags.includes(tag.name)) setTags(prev => [...prev, tag.name]);
    setTagSearch("");
  };

  const saveArticle = async () => {
    if (!title || !content) return;

    const tagNames = tags;
    const tagIds: number[] = [];

    for (let name of tagNames) {
      let tag = availableTags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (!tag) {
        const { data: newTag } = await supabase.from("tags").insert({ name }).select().single();
        if (newTag) {
          tagIds.push(newTag.id);
          setAvailableTags(prev => [...prev, newTag]);
        }
      } else tagIds.push(tag.id);
    }

    if (editingId) {
      const { error } = await supabase
        .from("articles")
        .update({ title, slug, content, excerpt, cover_url: cover, status, visibility })
        .eq("id", editingId);

      if (!error) {
        await supabase.from("article_tags_article_id_fkey").delete().eq("article_id", editingId);
        for (let tagId of tagIds) {
          await supabase.from("article_tags_article_id_fkey").insert({ article_id: editingId, tag_id: tagId });
        }
        setArticles(prev =>
          prev.map(a =>
            a.id === editingId ? { ...a, title, slug, content, excerpt, cover_url: cover, tags: tagNames, status, visibility } : a
          )
        );
        resetEditor();
      }
    } else {
      const { data: newArticle, error } = await supabase
        .from("articles")
        .insert({ title, slug, content, excerpt, cover_url: cover, status, visibility })
        .select()
        .single();

      if (newArticle && !error) {
        for (let tagId of tagIds) {
          await supabase.from("article_tags_article_id_fkey").insert({ article_id: newArticle.id, tag_id: tagId });
        }
        setArticles(prev => [...prev, { ...newArticle, tags: tagNames }]);
        resetEditor();
      }
    }
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setSlug(article.slug);
    setContent(article.content ?? "");
    setExcerpt(article.excerpt ?? "");
    setCover(article.cover_url ?? "");
    setTags(article.tags);
    setStatus(article.status ?? "draft");
    setVisibility(article.visibility ?? "public");
    setEditorExpanded(true);
  };

  const handleNewArticle = () => {
    resetEditor();
    setEditorExpanded(true);
  };

  return (
    <div className="space-y-6 dark:text-[#e5e5e5]  p-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search articles..."
          value={articleSearch}
          onChange={e => setArticleSearch(e.target.value)}
          className="dark:bg-[#222] dark:text-[#e5e5e5]"
        />
        <Button onClick={handleNewArticle}>New Article</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LogoLoader />
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map(a => (
              <Card key={a.id} className="p-4 relative dark:bg-[#1a1a1a] dark:border-gray-800">
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.excerpt}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {a.tags.map(t => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button size="sm" onClick={() => handleEdit(a)}>Edit</Button>
                </div>
              </Card>
            ))}
          </div>

          {editorExpanded && (
            <div className="grid gap-4 lg:grid-cols-3 mt-6">
              <Card className="p-4 sm:p-6 lg:col-span-2 dark:bg-[#1a1a1a]">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={e => { setTitle(e.target.value); setSlug(generateSlug(e.target.value)); }}
                  className="dark:bg-[#222] dark:text-[#e5e5e5]"
                />
                <Label className="mt-3">Slug *</Label>
                <Input
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="dark:bg-[#222] dark:text-[#e5e5e5]"
                />
                <Label className="mt-3">Content *</Label>
                <Textarea
                  value={content}
                  rows={12}
                  onChange={e => setContent(e.target.value)}
                  className="dark:bg-[#222] dark:text-[#e5e5e5]"
                />
              </Card>

              <Card className="p-4 sm:p-6 dark:bg-[#1a1a1a]">

                <Label>Excerpt</Label>
                <Textarea
                  rows={2}
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  className="dark:bg-[#222] dark:text-[#e5e5e5]"
                />

                <Label className="mt-3">Cover URL</Label>
                <Input
                  value={cover}
                  onChange={e => setCover(e.target.value)}
                  className="dark:bg-[#222] dark:text-[#e5e5e5]"
                />
                {cover && <img src={cover} className="mt-2 rounded-md border" />}

                <Label className="mt-3">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.map(t => (
                    <Badge key={t} className="flex items-center gap-1">
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter(tag => tag !== t))}
                        className="ml-1 text-xs font-bold"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>

                <Input
                  value={tagSearch}
                  placeholder="Search or add tag"
                  onChange={e => setTagSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddTag()}
                  className="dark:bg-[#222] dark:text-[#e5e5e5] mt-1"
                />

                <div className="flex flex-wrap gap-1 mt-1">
                  {availableTags
                    .filter(t =>
                      t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
                      !tags.includes(t.name)
                    )
                    .slice(0, 5)
                    .map(t => (
                      <Button key={t.id} size="sm" onClick={() => { setTags([...tags, t.name]); setTagSearch(""); }}>
                        {t.name}
                      </Button>
                    ))}
                  {tagSearch && !availableTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                    <Button size="sm" variant="outline" onClick={handleAddTag}>
                      Add "{tagSearch}"
                    </Button>
                  )}
                </div>
<div className="mt-4 flex flex-col gap-4">
  {/* Status Toggle */}
  <div>
    <Label className="mb-1">Status</Label>
    <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
      {(["draft", "published"] as const).map((option) => (
        <button
          key={option}
          onClick={() => setStatus(option)}
          className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 ${
            status === option
              ? "bg-blue-600 text-white dark:bg-blue-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#222] dark:text-[#e5e5e5] dark:hover:bg-gray-800"
          }`}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  </div>

  {/* Visibility Toggle */}
  <div>
    <Label className="mb-1">Visibility</Label>
    <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
      {(["public", "private"] as const).map((option) => (
        <button
          key={option}
          onClick={() => setVisibility(option)}
          className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 ${
            visibility === option
              ? "bg-green-600 text-white dark:bg-green-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#222] dark:text-[#e5e5e5] dark:hover:bg-gray-800"
          }`}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  </div>
</div>

                <Button onClick={saveArticle} className="mb-3">
                  {editingId ? "Update Article" : "Create Article"}
                </Button>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
