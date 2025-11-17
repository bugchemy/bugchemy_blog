"use client";
import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import UserManagement from "@/components/admin/UserManagement";
import TagManager from "@/components/admin/TagManager";
import AIArticleApproval from "@/components/admin/AIArticleApproval";
import ArticlesManager from "@/components/admin/ArticlesManager";
import AIStudio from "@/components/admin/AIStudio";
import CommentsManager from "@/components/admin/CommentsManager";
import IntegrationsManager from "@/components/admin/IntegrationsManager";



function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export default function Admin() {
  // Basic states
  const [posts, setPosts] = useState<number>(0)
  const [users, setUsers] = useState<any[]>([]);
  const [tagsData, setTagsData] = useState<any[]>([]);
  const [aiJobs, setAIJobs] = useState<any[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);



  // ---- Fetch all data ----
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

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

  // ---- UI ----
  return (
    <Layout>
      <SEO title="Bugchemy Admin" description="Manage posts, users, tags, and AI articles" />
      <section className="container px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 gap-1 lg:gap-2 h-auto flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="aistudio">AI Studio</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{posts}</div><p>Total Articles</p></Card>
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{users.length}</div><p>Users</p></Card>
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{tagsData.length}</div><p>Tags</p></Card>
              <Card className="p-4 sm:p-6"><div className="text-2xl font-bold">{aiJobs.filter(j=>j.status==="queued").length}</div><p>Pending AI</p></Card>
            </div>
            
          </TabsContent>


          {/* Articles */}
          <TabsContent value="articles" className="mt-6">
            <ArticlesManager />
          </TabsContent>


          {/* Tags */}
          <TabsContent value="tags" className="mt-6">
            <TagManager
            />
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="mt-6">
            <UserManagement/>
          </TabsContent>

          {/* AI Studio */}
          <TabsContent value="aistudio" className="mt-6">
            <AIStudio />
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comments" className="mt-6">
            <CommentsManager />
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="mt-6">
            <IntegrationsManager />
          </TabsContent>

        </Tabs>
      </section>
    </Layout>
  );
}
