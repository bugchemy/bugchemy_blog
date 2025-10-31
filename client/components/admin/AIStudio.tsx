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
}

export default function AIStudio() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AIJob | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // 🧭 Fetch all AI jobs
  async function fetchJobs() {
    const { data, error } = await supabase
      .from("ai_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading jobs:", error);
      return;
    }
    setJobs(data || []);
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  // 🪄 Trigger new AI job
  async function generateDraft() {
    if (!topic.trim()) return alert("Please enter a topic.");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_jobs")
        .insert([
          {
            topic,
            tone,
            length,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            status: "queued",
            prompt: `Write a ${length}-length blog article about "${topic}" in a ${tone} tone.`,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      alert("AI job queued successfully! Check back shortly.");
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

  // ✅ Approve & publish as article
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
      console.error("Error publishing article:", error);
      return alert("Error publishing article.");
    }

    await supabase
      .from("ai_jobs")
      .update({
        status: "approved",
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        review_notes: reviewNotes || null,
      })
      .eq("id", job.id);

    alert("Draft approved and saved as a new article!");
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

        <p className="text-muted-foreground text-sm">
          Generate new article drafts using AI. Adjust tone, length, and tags.
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Understanding Edge Functions"
            />
          </div>
          <div>
            <Label>Tone</Label>
            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. Conversational, Technical, Friendly"
            />
          </div>
          <div>
            <Label>Length</Label>
            <Input
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="Short / Medium / Long"
            />
          </div>
          <div>
            <Label>Tags</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma,separated,tags"
            />
          </div>
        </div>

        <Button
          onClick={generateDraft}
          disabled={loading || !topic.trim()}
          className="mt-2"
        >
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
          <p className="text-sm text-muted-foreground">No drafts yet.</p>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className={`p-4 cursor-pointer hover:border-primary transition ${
                  selectedJob?.id === job.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-base">{job.topic}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{job.tone}</Badge>
                      <Badge variant="outline">{job.length}</Badge>
                      {job.tags?.map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge
                    className={`${
                      job.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : job.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {job.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Selected Draft Review */}
      {selectedJob && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Reviewing: {selectedJob.topic}
            </h3>
            <Button
              variant="ghost"
              onClick={() => setSelectedJob(null)}
              className="text-xs"
            >
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

          <div className="space-y-2">
            <Label>Review Notes</Label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add review feedback or context"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => approveAndPublish(selectedJob)}
              disabled={selectedJob.status === "approved"}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve & Publish
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectDraft(selectedJob)}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
