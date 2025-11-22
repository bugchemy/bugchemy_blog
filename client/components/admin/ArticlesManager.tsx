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
import { Edit2 } from "lucide-react";

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

  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [Articletab, setArticleTab] = useState("draft");

  const [page, setPage] = useState(1);
  const pageSize = 9;

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

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setCurrentUser(data.user);
    };
    if (!user) fetchUser();
    else setCurrentUser(user);
  }, [user]);

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
      toast({ variant: "destructive", title: "Error fetching articles", description: error.message });
      return;
    }

    const normalized: Article[] = ((data ?? []) as any[]).map((r) => ({
      ...r,
      tags:
        (r.article_tags ?? []).map((t: any) => ({
          id: t.tag_id,
          name: Array.isArray(t.tags) && t.tags.length > 0 ? t.tags[0].name : t.tags?.name ?? "",
        })) ?? [],
    }));

    setArticles(normalized);
  }

  async function fetchTags() {
    const { data, error } = await supabase.from("tags").select("id, name").order("name");
    if (!error && data) setAllTags(data);
  }

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

  async function handleSave() {
    try {
    const previousStatus = article.status;
    const previousVisibility = article.visibility;
    const isNew = !article.id;
      let effectiveUser = user ?? currentUser ?? null;
      if (!effectiveUser) {
        const { data } = await supabase.auth.getUser();
        effectiveUser = data?.user ?? null;
        if (effectiveUser) setCurrentUser(effectiveUser);
      }

      if (!effectiveUser) {
        toast({ variant: "destructive", title: "User not found", description: "Please wait or re-login." });
        return;
      }
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
        const { data, error } = await supabase.from("articles").update(payload).eq("id", article.id).select("*").single();
        if (error) throw error;
        savedArticle = data;
      }

      if (savedArticle && !savedArticle.author_id) {
        await supabase.from("articles").update({ author_id: effectiveUser.id }).eq("id", savedArticle.id);
      }

      if (savedArticle) {
        await supabase.from("article_tags").delete().eq("article_id", savedArticle.id);

        for (const tag of selectedTags) {
          let tagId = tag.id;
          if (!tag.id || typeof tag.id === "string") {
            const { data: newTag } = await supabase.from("tags").insert({ name: tag.name }).select().single();
            tagId = newTag?.id;
          }
          await supabase.from("article_tags").insert({
            article_id: savedArticle.id,
            tag_id: tagId,
          });
        }
      }

      const changes: string[] = [];
      if (!isNew && savedArticle) {
        if (previousStatus !== savedArticle.status) {
          changes.push(`Status → "${savedArticle.status}"`);
        }
        if (previousVisibility !== savedArticle.visibility) {
          changes.push(`Visibility → "${savedArticle.visibility}"`);
        }
      }

      toast({
        title: isNew ? "Article created!" : "Article updated!",
        description:
          changes.length > 0
            ? `Your article "${savedArticle.title || article.title}" was saved. ${changes.join(" | ")}`
            : `Your article "${savedArticle.title || article.title}" was saved.`,
        variant: "default",
      });
      fetchArticles();
      handleCancel();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error saving article", description: err.message });
    }
  }

  function addTag() {
    if (!tagInput.trim()) return;
    const existing = allTags.find((t) => t.name.toLowerCase() === tagInput.toLowerCase());
    const newTag = existing || { id: "", name: tagInput };
    if (!selectedTags.find((t) => t.name === newTag.name)) setSelectedTags([...selectedTags, newTag]);
    setTagInput("");
  }

  function removeTag(name: string) {
    setSelectedTags(selectedTags.filter((t) => t.name !== name));
  }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  }

  const filteredArticles = useMemo(() => {
    let base = search
      ? articles.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
      : articles;

    if (Articletab === "draft") {
      base = base.filter((a) => a.status === "draft");
    } else if (Articletab === "pending") {
      base = base.filter((a) =>
        a.tags.some((t) =>
          ["review", "pending", "approval", "awaiting review"].includes(
            t.name.toLowerCase()
          )
        )
      );
    }
    return base;
  }, [articles, search, Articletab]);

  const paginatedArticles = filteredArticles.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredArticles.length / pageSize);

  return (
    <div className="p-0 space-y-0">
<Tabs value={Articletab} onValueChange={editing ? undefined : setArticleTab}>
  <TabsList
    className={`grid w-full grid-cols-2 gap-2 transition-opacity duration-300 ${
      editing ? "opacity-50 pointer-events-none" : ""
    }`}
  >
    <TabsTrigger value="draft">AI Draft</TabsTrigger>
    <TabsTrigger value="all_article">All Articles</TabsTrigger>
  </TabsList>

  {editing && (
    <div className="mt-2 p-2 text-sm bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 text-yellow-800 rounded-md shadow-sm animate-fade-in">
      ✏️ Editing in progress – finish editing to switch tabs.
    </div>
  )}



        {!editing && Articletab === "all_article" && (
          <div className="flex justify-between items-center mt-4">
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w mr-6"
            />
            <Button onClick={handleNewArticle}>+ New Article</Button>
          </div>
        )}

        <TabsContent value={Articletab} className="mt-3">
          {!editing ? (
            <>
              <ArticleGrid articles={paginatedArticles} onEdit={handleEdit} />

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <ArticleEditorForm
              article={article}
              setArticle={setArticle}
              handleCancel={handleCancel}
              handleSave={handleSave}
              selectedTags={selectedTags}
              removeTag={removeTag}
              addTag={addTag}
              tagInput={tagInput}
              setTagInput={setTagInput}
              allTags={allTags}
              generateSlug={generateSlug}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ArticleGrid = ({ articles, onEdit }: { articles: Article[]; onEdit: (a: Article) => void }) => (
  <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
    {articles.length === 0 ? (
      <p className="text-center text-muted-foreground col-span-full py-6">No articles found.</p>
    ) : (
      articles.map((a) => (
        <Card key={a.id} className="hover:shadow-lg transition">
          <CardHeader>
            <h3 className="font-bold">{a.title}</h3>
            <p className="text-sm text-muted-foreground">{a.slug}</p>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button size="sm" onClick={() => onEdit(a)}>
              <Edit2 className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))
    )}
  </div>
);

const ArticleEditorForm = ({
  article,
  setArticle,
  handleCancel,
  handleSave,
  selectedTags,
  removeTag,
  addTag,
  tagInput,
  setTagInput,
  allTags,
  generateSlug,
}: any) => (
  <Card className="p-4 space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">{article.id ? "Edit Article" : "New Article"}</h2>
      <div className="space-x-2">
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>

    <Input
      placeholder="Title"
      value={article.title ?? ""}
      onChange={(e) => setArticle({ ...article, title: e.target.value, slug: generateSlug(e.target.value) })}
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

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-semibold">Status</label>
        <select
          className="w-full p-2 rounded-md border
                    bg-background text-foreground 
                    border-input 
                    focus:outline-none focus:ring-2 focus:ring-ring
                    dark:bg-background dark:text-foreground dark:border-input" 
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
          className="w-full p-2 rounded-md border
                    bg-background text-foreground 
                    border-input 
                    focus:outline-none focus:ring-2 focus:ring-ring
                    dark:bg-background dark:text-foreground dark:border-input" 
          value={article.visibility}
          onChange={(e) => setArticle({ ...article, visibility: e.target.value })}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      {selectedTags.map((t: any) => (
        <span key={t.name} className="flex items-center gap-1 px-2 py-1 text-xs rounded-full 
                                  bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground 
                                  transition-all"
                                   onClick={() => removeTag(t.name)}>
          {t.name} ✕
        </span>
      ))}
    </div>


    {/***** */}

  

    {/***** */}
    <div className="sm:grid-cols-2 lg:grid-cols-3">
      <Input
        placeholder="Add or select a tag"
        value={tagInput ?? ""}
        onChange={(e) => setTagInput(e.target.value)}
        list="tags"
      />
      <datalist id="tags">
        {allTags.map((t: any) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>
      <Button onClick={addTag} variant="outline">Add</Button>
    </div>

    {/** Cover URL */}
    <div>
      <label className="text-sm font-semibold">Cover Image URL</label>
      <Input
        placeholder="https://example.com/image.png"
        value={article.cover_url ?? ""}
        onChange={(e) => setArticle({ ...article, cover_url: e.target.value })}
      />
      {article.cover_url && <img src={article.cover_url} alt="Preview" className="max-h-48 rounded-md border mt-2" />}
    </div>

    <Tabs defaultValue="write" className="mt-4">
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
          <Markdown content={article.content ?? ""} />
        </div>
      </TabsContent>
    </Tabs>
  </Card>
);
