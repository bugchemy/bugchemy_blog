import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

type Profile = { display_name: string | null };
type Article = { title: string | null; slug: string | null };

type Comment = {
  id: string;
  content: string;
  status: string;
  created_at: string;
  profiles: Profile[] | Profile | null;
  articles: Article[] | Article | null;
};

export default function CommentsManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchComments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  async function fetchComments(reset = false) {
    setLoading(true);
    const start = reset ? 0 : (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from("comments")
      .select(
        `
        id, content, status, created_at,
        profiles(display_name),
        articles(title, slug)
      `
      )
      .order("created_at", { ascending: false })
      .range(start, end);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
      return;
    }

    // ✅ Client-side search across all fields (since Supabase cannot filter nested relations)
    let filtered = data as Comment[];
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter((c) => {
        const article = Array.isArray(c.articles) ? c.articles[0] : c.articles;
        const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        return (
          c.content?.toLowerCase().includes(s) ||
          article?.title?.toLowerCase().includes(s) ||
          profile?.display_name?.toLowerCase().includes(s)
        );
      });
    }

    if (reset) {
      setComments(filtered);
      setPage(1);
    } else {
      setComments((prev) => [...prev, ...filtered]);
    }

    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
  }

  async function loadMore() {
    setPage((prev) => prev + 1);
    await fetchComments();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("comments").update({ status }).eq("id", id);
    fetchComments(true);
  }

  async function deleteComment(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    fetchComments(true);
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold">Comments Manager</h2>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search by content, article, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="divide-y">
        {comments.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No comments found.
          </p>
        )}

        {comments.map((c) => {
          const article = Array.isArray(c.articles) ? c.articles[0] : c.articles;
          const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;

          return (
            <div
              key={c.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="font-medium">{profile?.display_name || "Anonymous"}</p>
                <p className="text-sm text-muted-foreground mt-1 break-words max-w-md">
                  {c.content}
                </p>
                <p className="text-xs mt-1">
                  On:{" "}
                  <strong>{article?.title || "Untitled"}</strong> (
                  {new Date(c.created_at).toLocaleDateString()})
                </p>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
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
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteComment(c.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </Card>
  );
}
