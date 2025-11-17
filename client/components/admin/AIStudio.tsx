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
    if (!name.trim()) return alert("Tag name is required");
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
      alert(err.message || "Error saving tag");
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
      alert(err.message || "Error deleting tag");
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
  // tabs
  const [tab, setTab] = useState<"generate" | "tags">("generate");

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
    fetchJobs();
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
    if (!topic.trim()) return alert("Please enter a topic.");
    setLoading(true);
    try {
      const tags = selectedTags.map((t) => t.name);
      const { data, error } = await supabase.functions.invoke("generate_ai_article", {
        body: { topic, tone, length, tags },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Generation failed");

      alert(`AI job queued successfully! Job ID: ${data.jobId}`);
      setTopic("");
      setSelectedTags([]);
      setTone("Technical");
      setLength("Medium");
      fetchJobs();
      loadAllTags();
    } catch (err: any) {
      console.error("Error generating draft:", err);
      alert(err?.message || "Error generating draft.");
    } finally {
      setLoading(false);
    }
  }

  // approve & publish (calls server publish)
  async function approveAndPublish(job: AIJob) {
    if (!job) return;
    if (publishing) return;

    const alreadyPublished = Boolean(job.published_article_id) || job.status === "published";
    if (alreadyPublished) return alert("Article already published.");
    if (job.status !== "completed") return alert("This job is not completed yet.");

    const resultJson = job.result_json;
    if (!resultJson || !resultJson.content) return alert("No structured result found. The job must include result_json.content.");

    const title = resultJson.title?.trim() || job.topic;
    if (!title) return alert("Missing title for article.");
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

      alert("Article published successfully!");
      setSelectedJob(null);
      setReviewNotes("");
      fetchJobs();
    } catch (err: any) {
      console.error("Publish error:", err);
      alert(err?.message || "Failed to publish article.");
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
      alert("Draft rejected.");
      setSelectedJob(null);
      setReviewNotes("");
      fetchJobs();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject draft.");
    }
  }

  // UI: dark class wrapper
  const rootClass = darkMode ? "dark" : "";

  // Render
  return (
    <div className={`${rootClass} space-y-6`}>
      {/* top control bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button variant={tab === "generate" ? "default" : "ghost"} onClick={() => setTab("generate")}>Generate Article</Button>
          <Button variant={tab === "tags" ? "default" : "ghost"} onClick={() => setTab("tags")}>Manage Tags</Button>
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
              <Button variant="outline" onClick={() => { fetchJobs(); loadAllTags(); }} className="flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Refresh</Button>
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
                <select className="border rounded-md w-full p-2" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {toneOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Length */}
              <div>
                <Label>Length</Label>
                <select className="border rounded-md w-full p-2" value={length} onChange={(e) => setLength(e.target.value)}>
                  {lengthOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Tags multi-select */}
              <div>
                <Label>Tags</Label>

                <div className="mt-2">
                  <div className="flex gap-2 flex-wrap">
                    {selectedTags.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No tags selected</div>
                    ) : (
                      selectedTags.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => toggleTag(t)}
                          className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                        >
                          {t.name} ✕
                        </button>
                      ))
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full border rounded-md p-2 text-left flex justify-between items-center"
                        onClick={() => setTab("tags")}
                      >
                        Manage tags...
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="mt-2 grid gap-1 max-h-40 overflow-auto">
                        {allTags.map((tag) => {
                          const active = !!selectedTags.find((t) => t.id === tag.id);
                          return (
                            <div
                              key={tag.id}
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-2 rounded-md text-sm cursor-pointer flex justify-between items-center ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
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
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateDraft} disabled={loading || !topic.trim()}>
                {loading ? (<span className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Generating...</span>) : ("Queue AI Draft")}
              </Button>

              <Button variant="ghost" onClick={() => { setTopic(""); setSelectedTags([]); setTone("Technical"); setLength("Medium"); }}>
                Clear
              </Button>

              <div className="ml-auto text-sm text-muted-foreground">
                {selectedTags.length > 0 && <span>Selected tags: {selectedTags.map(t => t.name).join(", ")}</span>}
              </div>
            </div>
          </Card>

          {/* Job List */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Generated Drafts</h3>
            {jobs.length === 0 ? (<p>No drafts yet.</p>) : (
              <div className="grid gap-3">
                {jobs.map((job) => (
                  <Card key={job.id} className={`p-4 cursor-pointer hover:border-primary transition ${selectedJob?.id === job.id ? "border-primary" : ""}`} onClick={() => { setSelectedJob(job); fetchLogs(job.id); }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-base">{job.result_json?.title || job.topic}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">{job.result_json?.reading_duration ? `${job.result_json.reading_duration} min` : job.length}</Badge>
                          <Badge variant="outline">{job.tone}</Badge>
                          {job.model && <Badge variant="secondary">{job.model}</Badge>}
                          {(job.result_json?.tags || job.tags || []).slice(0, 3).map((t) => (<Badge key={t}>{t}</Badge>))}
                        </div>
                      </div>
                      <Badge>{job.published_article_id ? "published" : job.status}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Selected Draft / Review */}
          {selectedJob && (
            
            <Card className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Review: {selectedJob.result_json?.title || selectedJob.topic}</h3>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">{readingMinutes} min read</div>
                  <div>
                    <button
                      aria-label="Toggle preview"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="p-2 rounded-md hover:bg-muted"
                      title="Toggle preview"
                    >
                      {previewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      aria-label="Toggle dark mode"
                      onClick={() => setDarkMode(!darkMode)}
                      className="p-2 rounded-md hover:bg-muted"
                      title="Toggle dark/light"
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedJob(null)}>Close</Button>
                </div>
              </div>

              {selectedJob.result_json?.image_url || selectedJob.result_cover_url ? (
                <img src={selectedJob.result_json?.image_url || selectedJob.result_cover_url} className="rounded-lg w-full max-h-56 object-cover" alt="Cover" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><ImageIcon className="w-4 h-4" /> No cover image</div>
              )}

              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">{selectedJob.result_json?.reading_duration ? `${selectedJob.result_json.reading_duration} min read` : `${readingMinutes} min read`}</div>
                <div className="flex flex-wrap gap-2">{(selectedJob.result_json?.tags || selectedJob.tags || []).map((t) => <Badge key={t}>{t}</Badge>)}</div>
              </div>

              {/* Preview toggle */}
              <div>
                {previewMode ? (
                  <Markdown content={selectedJob.result_json?.content || selectedJob.result_summary || "*Draft not ready yet...*"} />
                ) : (
                  <Textarea value={selectedJob.result_json?.content || selectedJob.result_summary || ""} readOnly rows={16} />
                )}
              </div>

              {jobLogs.length > 0 && (
                <div className="bg-muted/30 rounded-md p-3 text-sm border">
                  <h4 className="font-semibold mb-2">🧾 Job Activity Log</h4>
                  <ul className="space-y-1">
                    {jobLogs.map((log) => (
                      <li key={log.id}>
                        <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()} — <strong className="text-primary">{log.event}</strong></span>
                        {log.message && <div className="text-xs ml-3">{log.message}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label>Review Notes (optional)</Label>
                <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => approveAndPublish(selectedJob)} disabled={publishing || selectedJob.status !== "completed" || Boolean(selectedJob.published_article_id)}>
                  {publishing ? (<span className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Publishing...</span>) : (<><CheckCircle2 className="w-4 h-4 mr-1" /> Approve & Publish</>)}
                </Button>

                <Button variant="destructive" onClick={() => rejectDraft(selectedJob)} disabled={Boolean(selectedJob.published_article_id) || selectedJob.status === "published"}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
