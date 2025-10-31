import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function CommentsManager() {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id, content, status, created_at,
        profiles(display_name),
        articles(title, slug)
      `)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setComments(data || []);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("comments").update({ status }).eq("id", id);
    fetchComments();
  }

  async function deleteComment(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    fetchComments();
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Comments Manager</h2>
      {comments.map((c) => (
        <div
          key={c.id}
          className="border-b pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{c.profiles?.display_name || "Anonymous"}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.content}</p>
            <p className="text-xs mt-1">
              On: <strong>{c.articles?.title}</strong> (
              {new Date(c.created_at).toLocaleDateString()})
            </p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <Button
              size="sm"
              onClick={() => updateStatus(c.id, "visible")}
              variant={c.status === "visible" ? "default" : "secondary"}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateStatus(c.id, "hidden")}
            >
              Hide
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteComment(c.id)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
}
