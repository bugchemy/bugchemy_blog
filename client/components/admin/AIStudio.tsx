import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Markdown from "@/components/Markdown";
import { supabase } from "@/lib/supabaseClient";

export default function AIStudio() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  async function generateDraft() {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/generate_ai_article`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, tone }),
        }
      );
      const data = await res.json();
      if (data.draft) setDraft(data.draft);
    } catch (err) {
      console.error(err);
      alert("Error generating draft");
    } finally {
      setLoading(false);
    }
  }

  async function approveAndPublish() {
    if (!draft) return;
    const slug = topic.toLowerCase().replace(/\s+/g, "-");
    await supabase.from("articles").insert({
      title: topic,
      content: draft.result_summary,
      slug,
      cover_url: draft.result_cover_url,
      visibility: "public",
      status: "published",
    });
    alert("Draft published!");
    setDraft(null);
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">AI Studio</h2>
      <p className="text-muted-foreground text-sm">
        Generate new article drafts using AI. Review and publish manually.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (e.g. Understanding WebSockets)"
        />
        <Input
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="Tone (e.g. Technical, Conversational)"
        />
      </div>

      <Button onClick={generateDraft} disabled={loading || !topic}>
        {loading ? "Generating..." : "Generate Draft"}
      </Button>

      {draft && (
        <div className="mt-6 space-y-4 border-t pt-4">
          <h3 className="font-bold text-lg">{draft.topic}</h3>
          {draft.result_cover_url && (
            <img src={draft.result_cover_url} className="rounded-lg w-full" />
          )}
          <Markdown content={draft.result_summary} />
          <div className="flex gap-3 mt-3">
            <Button onClick={approveAndPublish}>Approve & Publish</Button>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
