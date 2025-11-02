"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import Markdown from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface AIJob {
  id: string;
  topic: string;
  tone: string;
  length: string;
  tags?: string[];
  status: string;
  result_summary?: string;
  result_outline?: string;
  result_cover_url?: string;
  created_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  model?: string;
}

interface AIJobLog {
  id: string;
  job_id: string;
  event: string;
  message: string;
  created_at: string;
}

export default function AIStudio() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Technical");
  const [length, setLength] = useState("Medium");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AIJob | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [jobLogs, setJobLogs] = useState<AIJobLog[]>([]);

  // 🧭 Fetch all AI jobs
  async function fetchJobs() {
    const { data, error } = await supabase
      .from("ai_jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error loading jobs:", error);
    else setJobs(data || []);
  }

  // 🧾 Fetch logs for selected job
  async function fetchLogs(jobId: string) {
    const { data, error } = await supabase
      .from("ai_job_logs")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });
    if (error) console.error("Error fetching logs:", error);
    else setJobLogs(data || []);
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  // 🪄 Generate new draft
  async function generateDraft() {
    if (!topic.trim()) return alert("Please enter a topic.");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate_ai_article", {
        body: { topic, tone, length, tags: tags.split(",").map((t) => t.trim()) },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Generation failed");

      alert(`AI job queued successfully! Job ID: ${data.jobId}`);
      setTopic("");
      setTags("");
      fetchJobs();
    } catch (err) {
      console.error("Error generating draft:", err);
      alert("Error generating draft.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Approve & publish
  async function approveAndPublish(job: AIJob) {
    if (!job.result_summary) return alert("This draft is not yet ready.");
    const slug = job.topic.toLowerCase().replace(/\s+/g, "-");

    const { error } = await supabase.from("articles").insert([
      {
        title: job.topic,
        slug,
        content: job.result_summary,
        excerpt: job.result_outline || "",
        cover_url: job.result_cover_url || null,
        status: "draft",
        visibility: "public",
      },
    ]);
    if (error) {
      console.error("Error publishing:", error);
      return alert("Failed to publish.");
    }

    await supabase
      .from("ai_jobs")
      .update({
        status: "approved",
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        review_notes: reviewNotes || null,
      })
      .eq("id", job.id);

    alert("Draft approved and published!");
    setSelectedJob(null);
    setReviewNotes("");
    fetchJobs();
  }

  // ❌ Reject draft
  async function rejectDraft(job: AIJob) {
    await supabase
      .from("ai_jobs")
      .update({
        status: "rejected",
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        review_notes: reviewNotes || null,
      })
      .eq("id", job.id);

    alert("Draft rejected.");
    setSelectedJob(null);
    setReviewNotes("");
    fetchJobs();
  }

  return (
    <div className="space-y-6">
      {/* Generate Section */}
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">AI Studio</h2>
          <Button
            variant="outline"
            onClick={fetchJobs}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <Label>Tone</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <div>
            <Label>Length</Label>
            <Input value={length} onChange={(e) => setLength(e.target.value)} />
          </div>
          <div>
            <Label>Tags</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>

        <Button onClick={generateDraft} disabled={loading || !topic.trim()}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin w-4 h-4" /> Generating...
            </span>
          ) : (
            "Queue AI Draft"
          )}
        </Button>
      </Card>

      {/* Job List */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Generated Drafts</h3>
        {jobs.length === 0 ? (
          <p>No drafts yet.</p>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className={`p-4 cursor-pointer hover:border-primary transition ${
                  selectedJob?.id === job.id ? "border-primary" : ""
                }`}
                onClick={() => {
                  setSelectedJob(job);
                  fetchLogs(job.id);
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-base">{job.topic}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{job.tone}</Badge>
                      <Badge variant="outline">{job.length}</Badge>
                      {job.model && <Badge variant="secondary">{job.model}</Badge>}
                    </div>
                  </div>
                  <Badge>{job.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Selected Draft */}
      {selectedJob && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Review: {selectedJob.topic}
            </h3>
            <Button variant="ghost" onClick={() => setSelectedJob(null)}>
              Close
            </Button>
          </div>

          {selectedJob.result_cover_url && (
            <img
              src={selectedJob.result_cover_url}
              className="rounded-lg w-full"
              alt="Cover"
            />
          )}

          <Markdown content={selectedJob.result_summary || "*Draft not ready yet...*"} />

          {jobLogs.length > 0 && (
            <div className="bg-muted/30 rounded-md p-3 text-sm border">
              <h4 className="font-semibold mb-2">🧾 Job Activity Log</h4>
              <ul className="space-y-1">
                {jobLogs.map((log) => (
                  <li key={log.id}>
                    <span className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()} —{" "}
                      <strong className="text-primary">{log.event}</strong>
                    </span>
                    {log.message && (
                      <div className="text-xs ml-3">{log.message}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label>Review Notes</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={() => approveAndPublish(selectedJob)}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve & Publish
            </Button>
            <Button variant="destructive" onClick={() => rejectDraft(selectedJob)}>
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
