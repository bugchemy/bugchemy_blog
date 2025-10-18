import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import Markdown from "@/components/Markdown";
import { TagSelector } from "@/components/TagSelector";
import { useNavigate } from "react-router-dom";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string>("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [customSlug, setCustomSlug] = useState("");

  const [articles, setArticles] = useState<any[]>([]);
  const [aiJobs, setAiJobs] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState("new");
  const [fsOpen, setFsOpen] = useState(false);

  const slug = useMemo(() => slugify(title), [title]);

  /** 🔑 Check admin access */
  useEffect(() => {
    const sessionUser = supabase.auth.getUser().then((res) => {
      if (res.data.user) {
        setUser(res.data.user);
        fetchProfile(res.data.user.id);
      } else {
        navigate("/"); // redirect if not logged in
      }
    });
  }, []);

  const fetchProfile = async (id: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error || !data?.is_admin) {
      alert("You are not an admin");
      navigate("/"); // non-admin redirect
    } else {
      setIsAdmin(true);
      fetchArticles();
      fetchAIJobs();
    }
  };

  /** 📝 Fetch all articles */
  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          article_tags(tag_id, tags(name))
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error("Error fetching articles:", err);
    }
  };

  /** 🤖 Fetch AI jobs */
  const fetchAIJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAiJobs(data || []);
    } catch (err) {
      console.error("Error fetching AI jobs:", err);
    }
  };

  /** 💾 Save or update article */
  const saveArticle = async () => {
    if (!title.trim()) return alert("Title is required");

    try {
      let articleId = editingId;

      // 1️⃣ Insert or update article
      const articlePayload = {
        title,
        excerpt,
        content,
        cover,
        author_id: user?.id,
        slug: customSlug || slug,
      };

      if (editingId) {
        const { error } = await supabase.from("articles").update(articlePayload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("articles").insert(articlePayload).select("id").single();
        if (error) throw error;
        articleId = data.id;
      }

      // 2️⃣ Handle tags
      const tagNames = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const tagIds: string[] = [];
      for (const name of tagNames) {
        const { data: existingTag } = await supabase.from("tags").select("id").eq("name", name).single();
        let tagId = existingTag?.id;
        if (!tagId) {
          const { data: newTag } = await supabase.from("tags").insert({ name }).select("id").single();
          tagId = newTag.id;
        }
        tagIds.push(tagId);
      }

      // 3️⃣ Delete old article_tags
      await supabase.from("article_tags").delete().eq("article_id", articleId);

      // 4️⃣ Insert new article_tags
      const articleTagsPayload = tagIds.map((id) => ({ article_id: articleId, tag_id: id }));
      if (articleTagsPayload.length > 0) {
        await supabase.from("article_tags").insert(articleTagsPayload);
      }

      // Reset form & refresh
      setEditingId(null);
      setTitle("");
      setExcerpt("");
      setContent("");
      setTags("");
      setCover("");
      setCustomSlug("");
      fetchArticles();
      alert(editingId ? "Article updated" : "Article created");
      setTab("all");
    } catch (err: any) {
      console.error("Error saving article:", err);
      alert(err.message || "Error saving article");
    }
  };

  /** 🗑 Delete article */
  const deleteArticle = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("articles").delete().eq("id", id);
    await fetchArticles();
  };

  /** ✅ Approve AI job as article */
  const approveAIJob = async (job: any) => {
    if (!confirm("Approve this AI draft as an article?")) return;

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: job.topic || job.prompt.slice(0, 50),
        content: job.result_summary || job.prompt,
        author_id: user?.id,
        slug: slugify(job.topic || job.prompt.slice(0, 50)),
      })
      .select("id")
      .single();

    if (error) return alert(error.message);

    // Optionally, you could update ai_jobs.article_id to link
    await supabase.from("ai_jobs").update({ article_id: data.id, status: "approved" }).eq("id", job.id);

    fetchAIJobs();
    fetchArticles();
    alert("AI draft approved as article");
  };

  /** Load article into form for editing */
  const editArticle = (a: any) => {
    setEditingId(a.id);
    setTitle(a.title);
    setExcerpt(a.excerpt);
    setContent(a.content);
    setCover(a.cover || "");
    setTags(a.article_tags?.map((t: any) => t.tags.name).join(", ") || "");
    setCustomSlug(a.slug || "");
    setTab("new");
  };

  if (!isAdmin) return null; // render nothing until admin check completes

  return (
    <Layout>
      <SEO title="Admin Panel" description="Manage articles and AI drafts" />
      <section className="container px-4 py-10">
        <h1 className="text-3xl font-extrabold mb-6">Admin Panel</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="new">{editingId ? "Edit Article" : "New Article"}</TabsTrigger>
            <TabsTrigger value="all">All Articles</TabsTrigger>
            <TabsTrigger value="ai">AI Drafts</TabsTrigger>
          </TabsList>

          {/* NEW / EDIT ARTICLE */}
          <TabsContent value="new" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-6 lg:col-span-2">
                <div className="grid gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Content (Markdown)</Label>
                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="font-mono" />
                  </div>
                </div>
              </Card>

              <div className="grid gap-6">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Settings</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setFsOpen(true)}>Preview</Button>
                      <Button size="sm" onClick={saveArticle}>{editingId ? "Update" : "Publish"}</Button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label>Excerpt</Label>
                    <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
                    <Label>Cover URL</Label>
                    <Input value={cover} onChange={(e) => setCover(e.target.value)} />
                    <Label>Custom Slug</Label>
                    <Input value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} placeholder={slug || "generated-from-title"} />
                    <Label>Tags</Label>
                    <TagSelector value={tags} onChange={setTags} />
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold">Live Preview</h3>
                  <div className="mt-4 prose dark:prose-invert max-w-none">
                    <Markdown content={content} />
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ALL ARTICLES */}
          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4">
              {articles.map((a) => (
                <Card key={a.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.article_tags?.map((t: any) => t.tags.name).join(", ")}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => editArticle(a)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteArticle(a.id)}>Delete</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI JOBS */}
          <TabsContent value="ai" className="mt-6">
            <div className="grid gap-4">
              {aiJobs.map((job) => (
                <Card key={job.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{job.topic || job.prompt.slice(0, 50)}</div>
                    <div className="text-xs text-muted-foreground">{job.result_summary?.slice(0, 100)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveAIJob(job)}>Approve</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* FULLSCREEN PREVIEW */}
        <Dialog open={fsOpen} onOpenChange={setFsOpen}>
          <DialogContent className="w-full max-w-5xl h-[90vh] overflow-auto">
            <DialogTitle>Preview: {title}</DialogTitle>
            <Markdown content={content} />
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}
