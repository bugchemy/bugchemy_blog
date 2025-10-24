"use client";
import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import UserManagement from "@/components/admin/UserManagement";
import TagManager from "@/components/admin/TagManager";
import AIArticleApproval from "@/components/admin/AIArticleApproval";
import ArticlesManager from "@/components/admin/ArticlesManager";
import { supabase } from "@/lib/supabaseClient";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export default function Admin() {
  // Basic states
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string>("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("# Hello Bugchemy!\n\n```ts\nconsole.log('Hello, world!')\n```\n");
  const [author, setAuthor] = useState("Saurabh Katiyal");
  const [customSlug, setCustomSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [posts, setPosts] = useState<number>(0)
  const [users, setUsers] = useState<any[]>([]);
  const [tagsData, setTagsData] = useState<any[]>([]);
  const [aiJobs, setAIJobs] = useState<any[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const slug = useMemo(() => slugify(title), [title]);

  // ---- Fetch all data ----
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Fetch articles with author + tags
    //const { data: articles, error: artErr } = await supabase
    //  .from("articles")
   //   .select(`
    //    *,
    //    profiles(display_name, id),
    //    article_tags(tag_id),
    //    tags:article_tags(tag_id, tags(name, id))
    //  `)
    //  .order("created_at", { ascending: false });
    //if (artErr) console.error("Error fetching articles:", artErr);

    //Fetch Article Count
    const { count, error } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true });
    if (error) {
      console.error("Error fetching count:", error);
    }

    // Fetch tags
    const { data: tagsRes, error: tagErr } = await supabase.from("tags").select("*");
    if (tagErr) console.error("Error fetching tags:", tagErr);

    // Fetch users
    const { data: profiles, error: profErr } = await supabase.from("profiles").select("*");
   if (profErr) console.error("Error fetching profiles:", profErr);

    // Fetch AI jobs
    const { data: jobs, error: jobErr } = await supabase.from("ai_jobs").select("*").order("created_at", { ascending: false });
    if (jobErr) console.error("Error fetching AI jobs:", jobErr);

    setPosts(count || 0);
    setTagsData(tagsRes || []);
    setUsers(profiles || []);
    setAIJobs(jobs || []);
    setLoading(false);
  };

  // ---- Save or update post ----
  const savePost = async () => {
    const effectiveSlug = (customSlug || slug).trim();
    const tagNames = tags.split(",").map((t) => t.trim()).filter(Boolean);

    // Find or create tags
    const tagIds: number[] = [];
    for (const name of tagNames) {
      let tag = tagsData.find((t: any) => t.name === name);
      if (!tag) {
        const { data: inserted, error } = await supabase.from("tags").insert({ name }).select().single();
        if (!error && inserted) {
          tagIds.push(inserted.id);
        }
      } else {
        tagIds.push(tag.id);
      }
    }

    const articleData = {
      title,
      slug: effectiveSlug,
      excerpt,
      content,
      cover_url: cover,
      visibility: "public",
      status: "published",
      author_id: users.find((u) => u.display_name === author)?.id || null,
    };

    let articleId = editingId;
    if (editingId) {
      const { error } = await supabase.from("articles").update(articleData).eq("id", editingId);
      if (error) console.error(error);
    } else {
      const { data, error } = await supabase.from("articles").insert(articleData).select().single();
      if (!error && data) articleId = data.id;
    }

    if (articleId && tagIds.length > 0) {
      await supabase.from("article_tags").delete().eq("article_id", articleId);
      const tagLinks = tagIds.map((tid) => ({ article_id: articleId, tag_id: tid }));
      await supabase.from("article_tags").insert(tagLinks);
    }

    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setTags("");
    setCover("");
    setContent("");
    await fetchAll();
    setTab("articles");
    alert(`${editingId ? "Updated" : "Saved"}: ${title}`);
  };

  // ---- Edit post ----
  const editPost = (post: any) => {
    setEditingId(post.id);
    setTitle(post.title);
    setExcerpt(post.excerpt);
    setAuthor(post.profiles?.display_name || "");
    const postTags = post.tags?.map((t: any) => t.tags.name) || [];
    setTags(postTags.join(", "));
    setCover(post.cover_url || "");
    setContent(post.content);
    setTab("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- Delete post ----
  const deletePost = async (id: string) => {
    await supabase.from("articles").delete().eq("id", id);
    await fetchAll();
  };

  // ---- Toggle visibility ----
  const toggleVisibility = async (id: string, visible: boolean) => {
    await supabase.from("articles").update({ visibility: visible ? "public" : "private" }).eq("id", id);
    await fetchAll();
  };

  // ---- AI Job Approve / Reject / Delete ----
  const approveAIJob = async (jobId: string, customSlug?: string) => {
    const { data: job } = await supabase.from("ai_jobs").select("*").eq("id", jobId).single();
    if (!job) return;

    const { data: newArticle } = await supabase
      .from("articles")
      .insert({
        title: job.topic || "AI Generated",
        content: job.result_summary || "",
        slug: customSlug || slugify(job.topic || `ai-${Date.now()}`),
        status: "published",
        visibility: "public",
      })
      .select()
      .single();

    await supabase.from("ai_jobs").update({ status: "approved", article_id: newArticle.id }).eq("id", jobId);
    await fetchAll();
  };

  const rejectAIJob = async (jobId: string) => {
    await supabase.from("ai_jobs").update({ status: "rejected" }).eq("id", jobId);
    await fetchAll();
  };

  const deleteAIJob = async (jobId: string) => {
    await supabase.from("ai_jobs").delete().eq("id", jobId);
    await fetchAll();
  };

  // ---- Tag CRUD ----
  const addOrUpdateTag = async (tag: any, id?: number) => {
    if (id) await supabase.from("tags").update(tag).eq("id", id);
    else await supabase.from("tags").insert(tag);
    await fetchAll();
  };

  const deleteTag = async (id: number) => {
    await supabase.from("tags").delete().eq("id", id);
    await fetchAll();
  };



  const startNewPost = () => {
// To-do

  };

  // ---- UI ----
  return (
    <Layout>
      <SEO title="Bugchemy Admin" description="Manage posts, users, tags, and AI articles" />
      <section className="container px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <Button size="sm" variant="outline" onClick={startNewPost}>
            New Article
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-1 lg:gap-2 h-auto flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{posts}</div><p>Total Articles</p></Card>
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{users.length}</div><p>Users</p></Card>
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{tagsData.length}</div><p>Tags</p></Card>
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{aiJobs.filter(j=>j.status==="queued").length}</div><p>Pending AI</p></Card>
            </div>
          </TabsContent>


          {/* Articles */}
          <TabsContent value="articles" className="mt-6">
          {/* old code 
            <ArticlesManager
              posts={posts}
              onToggleVisibility={toggleVisibility}
              onEdit={editPost}
              onDelete={deletePost}
              onCreateNew={startNewPost}
            />
          */}
          <ArticlesManager/>
          </TabsContent>

          {/* AI */}
          <TabsContent value="ai" className="mt-6">
            <AIArticleApproval
              aiJobs={aiJobs}
              onApprove={approveAIJob}
              onReject={rejectAIJob}
              onDelete={deleteAIJob}
            />
          </TabsContent>

          {/* Tags */}
          <TabsContent value="tags" className="mt-6">
            <TagManager
              tags={tagsData}
              onAddTag={(t)=>addOrUpdateTag(t)}
              onUpdateTag={(id, t)=>addOrUpdateTag(t, id)}
              onDeleteTag={deleteTag}
            />
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="mt-6">
            <UserManagement/>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}
