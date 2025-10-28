import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Select from "react-select";
import { ArrowLeft, Save, Eye, Globe } from "lucide-react";

export default function ArticleEditor() {
  const { id } = useParams(); // if editing existing article
  const navigate = useNavigate();

  const [article, setArticle] = useState<any>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    cover_url: "",
    status: "draft",
    visibility: "public",
    seo_keywords: [],
    meta_description: "",
    tags: [],
  });

  const [allTags, setAllTags] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // ✅ Fetch article & tags
  useEffect(() => {
    fetchTags();
    if (id) fetchArticle(id);
  }, [id]);

  async function fetchTags() {
    const { data, error } = await supabase.from("tags").select("*").order("name");
    if (!error) setAllTags(data || []);
  }

  async function fetchArticle(articleId: string) {
    const { data, error } = await supabase
      .from("articles")
      .select("*, article_tags(tag_id), tags(id, name)")
      .eq("id", articleId)
      .single();
    if (error) console.error(error);
    else setArticle({
      ...data,
      tags: data.tags?.map((t: any) => ({ value: t.id, label: t.name })) || [],
    });
  }

  // ✅ Save article (insert or update)
  async function saveArticle(statusOverride?: string) {
    setIsSaving(true);
    const payload = {
      ...article,
      status: statusOverride || article.status,
      seo_keywords: Array.isArray(article.seo_keywords)
        ? article.seo_keywords
        : article.seo_keywords.split(",").map((k: string) => k.trim()),
    };

    // Auto-generate slug if missing
    if (!payload.slug && payload.title) {
      payload.slug = payload.title.toLowerCase().replace(/\s+/g, "-");
    }

    const { data, error } = id
      ? await supabase.from("articles").update(payload).eq("id", id).select("*").single()
      : await supabase.from("articles").insert([payload]).select("*").single();

    if (error) console.error(error);
    else {
      const articleId = data.id;
      // Update article_tags mapping
      await supabase.from("article_tags").delete().eq("article_id", articleId);
      const tagMappings = article.tags.map((t: any) => ({
        article_id: articleId,
        tag_id: t.value,
      }));
      if (tagMappings.length) await supabase.from("article_tags").insert(tagMappings);

      navigate("/admin/articles");
    }
    setIsSaving(false);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left: Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/admin/articles")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <h2 className="text-xl font-semibold">
              {id ? "Edit Article" : "New Article"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "secondary"}
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button disabled={isSaving} onClick={() => saveArticle()}>
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button disabled={isSaving} onClick={() => saveArticle("published")}>
              <Globe className="w-4 h-4 mr-2" /> Publish
            </Button>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto">
            {!previewMode ? (
              <div className="space-y-4">
                <Input
                  placeholder="Article Title"
                  className="text-3xl font-semibold"
                  value={article.title}
                  onChange={(e) => setArticle({ ...article, title: e.target.value })}
                />
                <Textarea
                  placeholder="Start writing in Markdown..."
                  className="h-[70vh]"
                  value={article.content}
                  onChange={(e) => setArticle({ ...article, content: e.target.value })}
                />
              </div>
            ) : (
              <Card className="p-4 prose max-w-none bg-white shadow-sm">
                <ReactMarkdown>{article.content || "_Nothing to preview yet..._"}</ReactMarkdown>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-white p-6 overflow-y-auto">
            <h3 className="font-semibold mb-3">Details</h3>
            <div className="space-y-3">
              <Input
                placeholder="Cover URL"
                value={article.cover_url}
                onChange={(e) => setArticle({ ...article, cover_url: e.target.value })}
              />
              <Input
                placeholder="Excerpt"
                value={article.excerpt}
                onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
              />
              <Textarea
                placeholder="Meta Description"
                value={article.meta_description}
                onChange={(e) =>
                  setArticle({ ...article, meta_description: e.target.value })
                }
              />
              <Input
                placeholder="SEO Keywords (comma separated)"
                value={article.seo_keywords.join(", ")}
                onChange={(e) =>
                  setArticle({
                    ...article,
                    seo_keywords: e.target.value.split(",").map((k) => k.trim()),
                  })
                }
              />

              <Select
                isMulti
                placeholder="Select tags..."
                value={article.tags}
                onChange={(selected) => setArticle({ ...article, tags: selected })}
                options={allTags.map((t) => ({ value: t.id, label: t.name }))}
                className="text-sm"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Public</span>
                <Switch
                  checked={article.visibility === "public"}
                  onCheckedChange={(v) =>
                    setArticle({ ...article, visibility: v ? "public" : "private" })
                  }
                />
              </div>

              <Badge variant={article.status === "published" ? "default" : "secondary"}>
                {article.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
