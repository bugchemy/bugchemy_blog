"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import Markdown from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  ImageIcon,
  Trash2,
  Edit2,
  ChevronDown,
  Moon,
  Sun,
  Eye,
  EyeOff,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { LogoLoader } from "@/components/LogoLoader";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Pagination, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { ToastClose } from "@/components/ui/toast";


// ------------------------
// Types
// ------------------------
type ResultJson = {
  title?: string;
  subtitle?: string;
  content?: string; // markdown
  tags?: string[];
  reading_duration?: number;
  image_url?: string;
  [k: string]: any;
};

interface AIJob {
  id: string;
  topic: string;
  tone: string;
  length: string;
  tags?: string[] | null;
  status: string;
  result_summary?: string;
  result_outline?: string;
  result_cover_url?: string;
  result_json?: ResultJson;
  created_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  model?: string;
  published_article_id?: string | null;
}

interface AIJobLog {
  id: string;
  job_id: string;
  event: string;
  message: string;
  created_at: string;
}

interface Tag {
  id: number;
  name: string;
  excerpt?: string | null;
  icon?: string | null;
  article_count?: number;
}

// ------------------------
// Helpers
// ------------------------
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function estimateReadingMinutes(markdown?: string) {
  if (!markdown) return 0;
  // remove markdown formatting roughly, then count words
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/[#>*_\-\[\]\(\)!]/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = 200;
  return Math.max(1, Math.round(words / wpm));
}

// ------------------------
// TagManager component (keeps original logic, emits tags via onTagsChange)
// ------------------------
function TagManager({ onTagsChange }: { onTagsChange?: (tags: Tag[]) => void }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [icon, setIcon] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const slug = useMemo(
    () => name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"),
    [name]
  );

  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data: tagData, error } = await supabase.from("tags").select("id, name, excerpt, icon");
      if (error) throw error;

      const { data: tagLinks, error: linkErr } = await supabase.from("article_tags").select("tag_id, article_id");
      if (linkErr) throw linkErr;

      const counts: Record<number, number> = {};
      tagLinks?.forEach((l: any) => {
        counts[l.tag_id] = (counts[l.tag_id] || 0) + 1;
      });

      const combined = (tagData || []).map((t: any) => ({
        ...t,
        article_count: counts[t.id] || 0,
      }));

      setTags(combined);
      onTagsChange?.(combined);
    } catch (err) {
      console.error("Error fetching tags:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()){
      toast({
        title: "Tag name is required",
        description: "Mandatory Check : Tag name is required",
        variant: "destructive",
      });
    } //return alert("Tag name is required");
    try {
      if (editingId) {
        const { error } = await supabase.from("tags").update({ name, excerpt, icon }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tags").insert({ name, excerpt, icon });
        if (error) throw error;
      }
      setName("");
      setExcerpt("");
      setIcon("");
      setEditingId(null);
      await fetchTags();
    } catch (err: any) {
      console.error("Error saving tag:", err);
      //alert(err.message || "Error saving tag");
      toast({
        title: "Error saving tag",
        description: err?.message || "Something went wrong saving tag.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this tag and remove all article relations?")) return;
    try {
      await supabase.from("article_tags").delete().eq("tag_id", id);
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
      await fetchTags();
    } catch (err: any) {
      console.error("Error deleting tag:", err);
      //alert(err.message || "Error deleting tag");
      toast({
        title: "Error deleting tag",
        description: err?.message || "Something went wrong deleting tag.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setExcerpt(tag.excerpt || "");
    setIcon(tag.icon || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setExcerpt("");
    setIcon("");
  };

  return (
    <div className="grid gap-6">
      <Card className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-semibold">{editingId ? "Edit Tag" : "Create New Tag"}</h3>
          <Button size="sm" variant="outline" onClick={fetchTags} disabled={loading} className="text-xs flex items-center gap-1">
            <RefreshCcw className="w-3 h-3" /> Refresh
          </Button>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="tag-name">Tag Name</Label>
            <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., JavaScript" />
            {name && (
              <p className="text-xs text-muted-foreground mt-1">
                Slug: <span className="font-mono">{slug}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="tag-excerpt">Description (optional)</Label>
            <Textarea id="tag-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief description for this tag" rows={2} />
          </div>

          <div>
            <Label htmlFor="tag-icon">Icon URL (optional)</Label>
            <Input id="tag-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="devicon:react" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit}>{editingId ? "Update Tag" : "Create Tag"}</Button>
            {editingId && <Button variant="outline" onClick={handleCancel}>Cancel</Button>}
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        <h3 className="text-base sm:text-lg font-semibold">Tags ({tags.length})</h3>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">{loading ? <LogoLoader /> : "No tags found."}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Card key={tag.id} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{tag.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Articles: <strong>{tag.article_count}</strong></p>
                    </div>
                    {tag.icon ? <Icon icon={tag.icon} className="text-2xl text-primary" /> : <span className="text-2xl">🧩</span>}
                  </div>
                  {tag.excerpt && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{tag.excerpt}</p>}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tag)}><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tag.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------
// Main AIStudio component
// ------------------------
export default function AIStudio() {
  //initialize toast
  const { toast } = useToast();
  // tabs
  const [tab, setTab] = useState<"generate" | "tags">("generate");

  const [filterStatus, setFilterStatus] = useState<"processing" | "completed" | "published" | "rejected" | "all" > ("completed");
  
  const [page, setPage] = useState(1);
  useEffect(() => {
  setPage(1); 
  }, [filterStatus]);

  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // generator states
  const [topic, setTopic] = useState("");
  const toneOptions = ["Technical", "Conversational", "Beginner-Friendly", "Advanced Expert", "SEO-Optimized", "Storytelling"];
  const lengthOptions = ["Short", "Medium", "Long"];
  const [tone, setTone] = useState<string>("Technical");
  const [length, setLength] = useState<string>("Medium");

  // tags: all and selected
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AIJob | null>(null);
  const [jobLogs, setJobLogs] = useState<AIJobLog[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  // preview & dark mode
  const [previewMode, setPreviewMode] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // reading time estimate
  const readingMinutes = useMemo(() => {
    const md = selectedJob?.result_json?.content || selectedJob?.result_summary || "";
    return estimateReadingMinutes(md);
  }, [selectedJob]);

  // load tags for selector
  async function loadAllTags() {
    try {
      const { data, error } = await supabase.from("tags").select("id, name, icon, excerpt");
      if (error) {
        console.error("Failed load tags", error);
        return;
      }
      setAllTags(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // fetch jobs
  {/** 
  async function fetchJobs() {
    try {
      const { data, error } = await supabase.from("ai_jobs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      setJobs((data || []) as AIJob[]);
    } catch (err) {
      console.error("Error loading jobs:", err);
      alert("Failed to load jobs (see console).");
    }
  }
  */}

  // fetch logs
  async function fetchLogs(jobId: string) {
    try {
      const { data, error } = await supabase.from("ai_job_logs").select("*").eq("job_id", jobId).order("created_at", { ascending: true });
      if (error) throw error;
      setJobLogs((data || []) as AIJobLog[]);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  }

  useEffect(() => {
    loadAllTags();
    //fetchJobs();
    fetchJobsByStatus();
    fetchStatusCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when selecting a job, populate selectedTags from result_json.tags or job.tags
  useEffect(() => {
    if (!selectedJob) return;
    const names = (selectedJob.result_json?.tags || selectedJob.tags || []) as string[];
    // resolve names to Tag objects in allTags; if not found create temporary objects with id = negative index
    const resolved: Tag[] = [];
    names.forEach((n, idx) => {
      const found = allTags.find((t) => t.name.toLowerCase() === n.toLowerCase());
      if (found) resolved.push(found);
      else resolved.push({ id: -(idx + 1), name: n });
    });
    setSelectedTags(resolved);
  }, [selectedJob, allTags]);

  // toggle tag selection
  const toggleTag = (tag: Tag) => {
    if (selectedTags.find((t) => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // generate draft (sends tag names array)
  async function generateDraft() {
    if (!topic.trim()) {
      toast({
        title: "Please enter a topic.",
        description: "Mandatory Check : Topic should not be blanck or space, should contain meaningful topic.",
        variant: "default",
      });
    }//return alert("Please enter a topic.");
    setLoading(true);
    try {
      const tags = selectedTags.map((t) => t.name);
      const { data, error } = await supabase.functions.invoke("generate_ai_article", {
        body: { topic, tone, length, tags },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Generation failed");

      //alert(`AI job queued successfully! Job ID: ${data.jobId}`);
      toast({
        title: "AI job for article successfully queued",
        description: `"Tracking Id: ${data.jobId}".`,
        variant: "default",
      });

      setTopic("");
      setSelectedTags([]);
      setTone("Technical");
      setLength("Medium");
      //fetchJobs();
      loadAllTags();
    } catch (err: any) {
      console.error("Error generating draft:", err);
      //alert(err?.message || "Error generating draft.");
        toast({
        title: "Error generating draft.",
        description: err?.message || "Something went wrong generating draft.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // approve & publish (calls server publish)
  async function approveAndPublish(job: AIJob) {
    if (!job) return;
    if (publishing) return;

    const alreadyPublished = Boolean(job.published_article_id) || job.status === "published";
    if (alreadyPublished) {
      toast({
        title: "Article already published",
        description: "This article has already been published and cannot be published again.",
        variant: "destructive",
      });
      return;
    }
    if (job.status !== "completed") {
      toast({
        title: "This job is not completed yet.",
        description: "This job is not completed yet, Please try after sometime.",
        variant: "destructive",
      });
      return;
    }
    const resultJson = job.result_json;
    if (!resultJson || !resultJson.content) {
      //return alert("No structured result found. The job must include result_json.content.");
      toast({
        title: "No JSON structure found.",
        description: "No structured result found. The job must include result_json.content.",
        variant: "destructive",
      });
    }

    const title = resultJson.title?.trim() || job.topic;
    if (!title){
      toast({
        title: "Missing title for article.",
        description: "Generate Article does not have a title, Please regenerate or contact support.",
        variant: "destructive",
      });
    }//return alert("Missing title for article.");
    const slug = slugify(title);

    if (!confirm(`Publish article "${title}" with slug "${slug}"?`)) return;

    setPublishing(true);
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const access_token = (session as any)?.access_token ?? null;

      const { data, error } = await supabase.functions.invoke("publish_ai_article", {
        body: { jobId: job.id, access_token, review_notes: reviewNotes || null },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Publish failed");

      //alert("Article published successfully!");
      toast({
        title: "Article sent for review successfully!",
        description: "Please check Admin > Article (tab) > AI Draft (sub-tab) to review to validate the draft.",
        variant: "destructive",
      });
      setSelectedJob(null);
      setReviewNotes("");
      //fetchJobs();
    } catch (err: any) {
      console.error("Publish error:", err);
      //alert(err?.message || "Failed to publish article.");
        toast({
        title: "Failed to publish article for review",
        description: err?.message || "Something went wrong while sending draft for review.",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  }

  // reject draft
  async function rejectDraft(job: AIJob) {
    if (!confirm("Reject this draft? This action can be returned later.")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("ai_jobs").update({
        status: "rejected",
        reviewed_by: user?.id ?? null,
        review_notes: reviewNotes || null,
      }).eq("id", job.id);

      if (error) throw error;
      //alert("Draft rejected.");
      toast({
        title: "Draft Rejected",
        description: "The draft has been successfully rejected.",
        variant: "destructive",
      });
      setSelectedJob(null);
      setReviewNotes("");
      //fetchJobs();
    } catch (err) {
      console.error("Reject error:", err);
      //alert("Failed to reject draft.");
      toast({
        title: "Draft Rejection Failed.",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  }

    async function fetchJobsByStatus() {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("ai_jobs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, count, error } = await query;

      if (!error) {
        setJobs(data || []);
        setTotalCount(count || 0);

        const maxPage = Math.max(1, Math.ceil((count || 0) / pageSize));

        if (page > maxPage) {
          setPage(maxPage); // 🔥 Keep page valid
        }
      }
    }


useEffect(() => {
  fetchJobsByStatus();
}, [filterStatus, page]);

function openJobDrawer(job: AIJob) {
  setSelectedJob(job);
  fetchLogs(job.id);
}

function closeJobDrawer() {
  setSelectedJob(null);
}

function nextPage() {
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  if (page < maxPage) {
    setPage(page + 1);
  }
}

function prevPage() {
  if (page > 1) {
    setPage(page - 1);
  }
}


async function fetchStatusCounts() {
  const statuses = ["processing", "completed", "published", "rejected"];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from("ai_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    counts[status] = count || 0;
  }

  // Also get "all"
  const { count: all } = await supabase
    .from("ai_jobs")
    .select("*", { count: "exact", head: true });

  counts["all"] = all || 0;

  setStatusCounts(counts);
}


  // Render
  return (
    <div className="space-y-6">
      {/* top control bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button variant={tab === "generate" ? "default" : "ghost"} onClick={() => setTab("generate")}>Generate Article</Button>
          <Button variant={tab === "tags" ? "default" : "destructive"} onClick={() => setTab("tags")}>Manage Tags</Button>
        </div>


      </div>

      {/* TAB: Tag Manager */}
      {tab === "tags" ? (
        <div>
          <TagManager onTagsChange={(t) => setAllTags(t)} />
        </div>
      ) : (
        <>
          {/* Generator Card */}
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI Studio</h2>
              <Button variant="outline" onClick={() => { fetchJobsByStatus(); loadAllTags(); }} className="flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Refresh</Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Topic */}
              <div className="md:col-span-3">
                <Label>Topic</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Understanding React Server Components" />
              </div>

              {/* Tone */}
              <div>
                <Label>Tone</Label>
                <select className="border rounded-md w-full p-2
                            bg-background text-foreground 
                            border-input 
                            focus:outline-none focus:ring-2 focus:ring-ring
                            dark:bg-background dark:text-foreground dark:border-input" 
                value={tone} onChange={(e) => setTone(e.target.value)}>
                  {toneOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Length */}
              <div>
                <Label>Length</Label>
                <select className="border rounded-md w-full p-2
                            bg-background text-foreground 
                            border-input 
                            focus:outline-none focus:ring-2 focus:ring-ring
                            dark:bg-background dark:text-foreground dark:border-input"
                value={length} onChange={(e) => setLength(e.target.value)}>
                  {lengthOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Tags Multi-select */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tags</Label>

                {/* Selected Tags Display */}
                <div className="flex flex-wrap gap-2 min-h-[38px] rounded-md border bg-background px-3 py-2">
                  {selectedTags.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No tags selected</span>
                  ) : (
                    selectedTags.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => toggleTag(t)}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded-full 
                                  bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground 
                                  transition-all"
                      >
                        {t.name} <span className="font-semibold">×</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Tags Selector List */}
                <div className="rounded-lg border bg-muted/30 p-2 max-h-48 overflow-auto">
                  <div className="grid gap-1">
                    {allTags.map((tag) => {
                      const active = !!selectedTags.find((t) => t.id === tag.id);
                      return (
                        <div
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className={`
                            flex items-center justify-between cursor-pointer px-3 py-2 rounded-md text-sm 
                            transition-all border
                            ${active
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "hover:bg-muted/50 border-transparent"
                            }
                          `}
                        >
                          <span>{tag.name}</span>
                          {active && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateDraft} disabled={loading || !topic.trim()}>
                {loading ? (<span className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Generating...</span>) : ("Queue AI Draft")}
              </Button>

              <Button variant="destructive" onClick={() => { setTopic(""); setSelectedTags([]); setTone("Technical"); setLength("Medium"); }}>
                Clear
              </Button>

                <Button
                  variant="destructive"
                  onClick={() => setTab("tags")}
                  >
                   Manage Tags
                  </Button>

              <div className="ml-auto text-sm text-muted-foreground">
                {selectedTags.length > 0 && <span>Selected tags: {selectedTags.map(t => t.name).join(", ")}</span>}
              </div>
            </div>
          </Card>

          {/* Job List */}
          {/* ======== Generated Drafts Section with Tabs, Pagination & Drawer ======== */}
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Generated Drafts</h3>

              {/* Status Tabs */}
              <Tabs value={filterStatus} onValueChange={(val) => setFilterStatus(val as any)}>
              <TabsList>
                <TabsTrigger value="processing">
                  Processing ({statusCounts.processing || 0})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({statusCounts.completed || 0})
                </TabsTrigger>
                <TabsTrigger value="published">
                  Published ({statusCounts.published || 0})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({statusCounts.rejected || 0})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({statusCounts.all || 0})
                </TabsTrigger>
              </TabsList>


                <TabsContent value={filterStatus}>
                  {jobs.length === 0 ? ( <div className="text-center py-10 text-muted-foreground">
                        <p className="text-sm">No drafts found in this category.</p>
                      </div>
                    )  : (
                    <div className="grid gap-3">
                      {jobs.map((job) => (
                        <Card
                          key={job.id}
                          className="p-4 cursor-pointer hover:border-primary transition"
                          onClick={() => openJobDrawer(job)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-base line-clamp-1">{job.result_json?.title || job.topic}</h4>
                              <div className="flex gap-2 mt-1 flex-wrap text-xs">
                                <Badge variant="outline">{job.tone}</Badge>
                                {job.model && <Badge variant="secondary">{job.model}</Badge>}
                                {(job.result_json?.tags || job.tags || []).slice(0, 3).map((t) => (
                                  <Badge key={t}>{t}</Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(job.created_at!).toLocaleString()}
                              </p>
                            </div>
                            <Badge
                              className="capitalize"
                              variant={
                                job.status === "completed"
                                  ? "secondary"
                                  : job.status === "published"
                                  ? "default"
                                  : job.status === "processing"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {job.published_article_id ? "published" : job.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  <div className="fgrid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex justify-center items-center w-full mt-4">
                      <span className="text-sm text-muted-foreground">
                        Page {Math.min(page, Math.ceil(totalCount / pageSize) || 1)} of {Math.max(1, Math.ceil(totalCount / pageSize))}
                      </span>
                    </div>
                    <Pagination>
                      <PaginationPrevious onClick={prevPage} disabled={page === 1} />

                      <PaginationNext
                        onClick={nextPage}
                        disabled={page >= Math.ceil(totalCount / pageSize) || jobs.length === 0}
                      />
                    </Pagination>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>


          {/* Selected Draft / Review */}
          {/* ======= Drawer Panel for Selected Job ======= */}
          <Sheet open={Boolean(selectedJob)} onOpenChange={closeJobDrawer}>
          <SheetContent
            side="right"
            className={`
              fixed inset-0 
              w-screen h-screen 
              max-w-none !max-w-none  /* ⛔ overrides internal max-width */
              p-6 overflow-y-auto 
              bg-background text-foreground 
              transition-all
              rounded-none shadow-none
            `}
          >
            {/* ---- Custom Close Button ---- 
            <button
              onClick={closeJobDrawer}
              className="absolute right-4 top-4 z-50 p-2 rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
            */}

            {/* ---- Header ---- */}
            <div className="max-w-4xl mx-auto mt-10">
              <SheetTitle className="text-3xl font-bold leading-tight">
                {selectedJob?.result_json?.title || selectedJob?.topic}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground mt-1">
                {readingMinutes} min read
              </SheetDescription>
            </div>

            {/* ---- Tags ---- */}
            {selectedJob && (
              <div className="max-w-4xl mx-auto flex flex-wrap gap-2 mt-4 mb-6">
                {(selectedJob.result_json?.tags || selectedJob.tags || []).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            )}

            {/* ---- Cover Image ---- */}
            {selectedJob?.result_json?.image_url && (
              <img
                src={selectedJob.result_json.image_url}
                className="w-full max-h-96 object-cover mb-6"
              />
            )}

            {/* ---- Content ---- */}
            <div className={`${darkMode ? "prose-invert" : "prose"} max-w-4xl mx-auto`}>
              <Markdown content={selectedJob?.result_json?.content || "*No content available.*"} />
            </div>

            {/* ---- Footer Actions ---- */}
            <div className="max-w-4xl mx-auto flex justify-end gap-4 mt-10 mb-6">
              <Button
                onClick={() => approveAndPublish(selectedJob!)}
                disabled={publishing || selectedJob?.status !== "completed"}
              >
                {publishing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Publish
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectDraft(selectedJob!)}
                disabled={selectedJob?.status === "published"}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          </SheetContent>

          </Sheet>


        </>
      )}





    </div>
  );
}
