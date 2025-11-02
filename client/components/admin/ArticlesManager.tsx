import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Markdown from "@/components/Markdown";

interface Tag {
  id: number | string;
  name: string;
}

interface Article {
  id?: string;
  author_id?: string | null;
  title: string;
  slug: string;
  excerpt?: string;
  cover_url?: string;
  meta_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  content: string;
  status: string;
  visibility: string;
  created_at?: string;
  updated_at?: string;
  tags: Tag[];
}

export default function ArticlesManager() {
  const { toast } = useToast();

  const user = useUser();
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setCurrentUser(data.user);
    };
    if (!user) fetchUser();
    else setCurrentUser(user);
  }, [user]);

  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [article, setArticle] = useState<Article>({
    title: "",
    slug: "",
    excerpt: "",
    cover_url: "",
    meta_description: "",
    seo_keywords: [],
    canonical_url: "",
    content: "",
    status: "draft",
    visibility: "public",
    tags: [],
  });

  // ───────────────────────────── Fetch all articles & tags ─────────────────────────────
  useEffect(() => {
    fetchArticles();
    fetchTags();
  }, []);

  async function fetchArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        id, title, slug, excerpt, cover_url, meta_description, seo_keywords, canonical_url,
        content, status, visibility, created_at, updated_at,
        article_tags(tag_id, tags(name))
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching articles",
        description: error.message,
      });
      return;
    }

    const normalized: Article[] = ((data ?? []) as unknown as any[]).map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt ?? "",
      cover_url: r.cover_url ?? "",
      meta_description: r.meta_description ?? "",
      seo_keywords: r.seo_keywords ?? [],
      canonical_url: r.canonical_url ?? "",
      content: r.content ?? "",
      status: r.status ?? "draft",
      visibility: r.visibility ?? "public",
      created_at: r.created_at,
      updated_at: r.updated_at,
      tags:
        (r.article_tags ?? []).map((t: any) => {
          const tagName =
            Array.isArray(t.tags) && t.tags.length > 0
              ? t.tags[0].name
              : t.tags?.name ?? "";
          return { id: t.tag_id, name: tagName };
        }) ?? [],
    }));

    setArticles(normalized);
  }

  async function fetchTags() {
    const { data, error } = await supabase.from("tags").select("id, name").order("name");
    if (!error && data) setAllTags(data);
  }

  // ───────────────────────────── CRUD ─────────────────────────────

  function handleNewArticle() {
    setEditing(true);
    setArticle({
      title: "",
      slug: "",
      excerpt: "",
      cover_url: "",
      meta_description: "",
      seo_keywords: [],
      canonical_url: "",
      content: "",
      status: "draft",
      visibility: "public",
      tags: [],
    });
    setSelectedTags([]);
  }

  function handleEdit(a: Article) {
    setEditing(true);
    setArticle({ ...a });
    setSelectedTags(a.tags ?? []);
  }

  function handleCancel() {
    setEditing(false);
    setArticle({
      title: "",
      slug: "",
      excerpt: "",
      cover_url: "",
      meta_description: "",
      seo_keywords: [],
      canonical_url: "",
      content: "",
      status: "draft",
      visibility: "public",
      tags: [],
    });
    setSelectedTags([]);
  }

  // ---------- REPLACED handleSave(): robust user resolution & preserve author ----------
  async function handleSave() {
    try {
      // Resolve effective user: prefer useUser(), fall back to currentUser state, then supabase.auth.getUser()
      let effectiveUser = user ?? currentUser ?? null;
      if (!effectiveUser) {
        const { data } = await supabase.auth.getUser();
        effectiveUser = data?.user ?? null;
        if (effectiveUser) setCurrentUser(effectiveUser);
      }

      if (!effectiveUser) {
        toast({
          variant: "destructive",
          title: "User not found",
          description: "Please wait until user is loaded or re-login.",
        });
        return;
      }

      const isNew = !article.id;

      // Only set author_id for new articles — do not overwrite existing author on update
      const payload: any = {
        title: article.title,
        slug: article.slug || generateSlug(article.title),
        excerpt: article.excerpt,
        cover_url: article.cover_url,
        meta_description: article.meta_description,
        seo_keywords: article.seo_keywords,
        canonical_url: article.canonical_url,
        content: article.content,
        status: article.status,
        visibility: article.visibility,
      };
      if (isNew) payload.author_id = effectiveUser.id;

      let savedArticle;
      if (isNew) {
        const { data, error } = await supabase.from("articles").insert([payload]).select().single();
        if (error) throw error;
        savedArticle = data;
      } else {
        const { data, error } = await supabase
          .from("articles")
          .update(payload)
          .eq("id", article.id)
          .select()
          .single();
        if (error) throw error;
        savedArticle = data;
      }

      // ensure author_id exists (safety patch)
      if (savedArticle && !savedArticle.author_id) {
        await supabase.from("articles").update({ author_id: effectiveUser.id }).eq("id", savedArticle.id);
      }

      // Tag handling (unchanged)
      if (savedArticle) {
        await supabase.from("article_tags").delete().eq("article_id", savedArticle.id);

        for (const tag of selectedTags) {
          let tagId = tag.id;

          if (!tag.id || typeof tag.id === "string") {
            const { data: newTag, error: tagErr } = await supabase
              .from("tags")
              .insert({ name: tag.name })
              .select()
              .single();
            if (!tagErr && newTag) tagId = newTag.id;
          }

          await supabase.from("article_tags").insert({
            article_id: savedArticle.id,
            tag_id: tagId,
          });
        }
      }

      toast({
        title: isNew ? "Article created!" : "Article updated!",
        description: `Your article "${article.title}" was successfully saved.`,
      });

      fetchArticles();
      handleCancel();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving article",
        description: err.message,
      });
    }
  }
  // ---------- end handleSave replacement ----------

  // ───────────────────────────── Tags ─────────────────────────────

  function addTag() {
    if (!tagInput.trim()) return;
    const existing = allTags.find((t) => t.name.toLowerCase() === tagInput.toLowerCase());
    const newTag = existing || { id: "", name: tagInput };
    if (!selectedTags.find((t) => t.name === newTag.name)) {
      setSelectedTags([...selectedTags, newTag]);
    }
    setTagInput("");
  }

  function removeTag(name: string) {
    setSelectedTags(selectedTags.filter((t) => t.name !== name));
  }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  }

  const filteredArticles = useMemo(() => {
    if (!search) return articles;
    return articles.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));
  }, [articles, search]);

  // ───────────────────────────── UI ─────────────────────────────

  return (
    <div className="p-4 space-y-4">
      {!editing && (
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleNewArticle}>+ New Article</Button>
        </div>
      )}

      {!editing && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((a) => (
            <Card key={a.id} className="hover:shadow-lg transition">
              <CardHeader>
                <h3 className="font-bold">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.slug}</p>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" onClick={() => handleEdit(a)}>
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{article.id ? "Edit Article" : "New Article"}</h2>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>

          <Input
            placeholder="Title"
            value={article.title ?? ""}
            onChange={(e) =>
              setArticle({
                ...article,
                title: e.target.value,
                slug: generateSlug(e.target.value),
              })
            }
          />

          <Input
            placeholder="Slug"
            value={article.slug ?? ""}
            onChange={(e) => setArticle({ ...article, slug: e.target.value })}
          />

          <Textarea
            placeholder="Excerpt"
            value={article.excerpt ?? ""}
            onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
          />

          {/* Visibility & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Status</label>
              <select
                className="w-full border rounded-md p-2"
                value={article.status}
                onChange={(e) => setArticle({ ...article, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Visibility</label>
              <select
                className="w-full border rounded-md p-2"
                value={article.visibility}
                onChange={(e) => setArticle({ ...article, visibility: e.target.value })}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* SEO Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">SEO Settings</h3>
            <Textarea
              placeholder="Meta Description"
              value={article.meta_description ?? ""}
              onChange={(e) => setArticle({ ...article, meta_description: e.target.value })}
            />
            <Input
              placeholder="SEO Keywords (comma separated)"
              value={article.seo_keywords?.join(", ") ?? ""}
              onChange={(e) =>
                setArticle({ ...article, seo_keywords: e.target.value.split(",").map((kw) => kw.trim()) })
              }
            />
            <Input
              placeholder="Canonical URL"
              value={article.canonical_url ?? ""}
              onChange={(e) => setArticle({ ...article, canonical_url: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Tags</label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((t) => (
                <span
                  key={t.name}
                  className="px-2 py-1 bg-secondary rounded-md cursor-pointer hover:bg-destructive hover:text-white"
                  onClick={() => removeTag(t.name)}
                >
                  {t.name} ✕
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add or select a tag"
                value={tagInput ?? ""}
                onChange={(e) => setTagInput(e.target.value)}
                list="tags"
              />
              <datalist id="tags">
                {allTags.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
              <Button onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {/* Cover URL */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Cover Image URL</label>
            <Input
              placeholder="https://example.com/image.png"
              value={article.cover_url ?? ""}
              onChange={(e) => setArticle({ ...article, cover_url: e.target.value })}
            />
            {article.cover_url && (
              <img src={article.cover_url} alt="Preview" className="max-h-48 rounded-md border" />
            )}
          </div>

          {/* Markdown Editor */}
          <Tabs defaultValue="write">
            <TabsList>
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Textarea
                placeholder="Write in Markdown..."
                className="h-64"
                value={article.content ?? ""}
                onChange={(e) => setArticle({ ...article, content: e.target.value })}
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose dark:prose-invert max-w-none p-4 border rounded-md">
                <Markdown content={article.content ?? ""}/>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
