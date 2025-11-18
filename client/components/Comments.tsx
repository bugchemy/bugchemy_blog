"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogoLoader } from "@/components/LogoLoader";

type Comment = {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
};

type CommentsProps = {
  articleId: string;
};

export default function Comments({ articleId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Fetch current user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      setLoading(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
  if (!user) return;

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  fetchProfile();
}, [user]);

  // Fetch comments only if user is logged in
  useEffect(() => {
    if (!user) return;

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          article_id,
          user_id,
          content,
          created_at,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }

      const formatted = (data ?? []).map((c: any) => ({
        id: c.id,
        article_id: c.article_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        profiles: c.profiles
          ? {
              id: c.profiles.id,
              display_name: c.profiles.display_name,
              avatar_url: c.profiles.avatar_url,
            }
          : {
              id: "",
              display_name: "Unknown",
              avatar_url: "",
            },
      }));

      setComments(formatted);
    };

    fetchComments();
  }, [articleId, user]);

  // Add a new comment
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim(),
        },
      ])
      .select(`id, article_id, user_id, content, created_at`)
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      return;
    }

      // ✅ Use the fetched profile if available
  const newEntry: Comment = {
    id: data.id,
    article_id: data.article_id,
    user_id: data.user_id,
    content: data.content,
    created_at: data.created_at,
    profiles: profile
      ? profile
      : {
          id: user.id,
          display_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Anonymous",
          avatar_url:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            "",
        },
  };

  setComments((prev) => [...prev, newEntry]);
  setNewComment("");
};

  if (loading) {
    return  <div className="flex items-center justify-center h-screen text-lg"> <LogoLoader /> </div>
  }

  return (
    <Card className="mt-6 border rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Comments</h3>

        {/* Add Comment Input */}
        <div className="flex items-center gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Write a comment..." : "Log in to post a comment"}
            disabled={!user}
          />
          <Button onClick={handleAddComment} disabled={!user || !newComment.trim()}>
            Post
          </Button>
        </div>

        {/* If not logged in */}
        {!user && (
          <p className="text-sm text-muted-foreground">
            ⚠️ Please <span className="font-medium">log in</span> to view and add comments.
          </p>
        )}

        {/* Show comments only if user is logged in */}
        {user && (
          <div className="space-y-3 mt-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={comment.profiles.avatar_url || ""} />
                    <AvatarFallback>
                      {comment.profiles.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">
                      {comment.profiles.display_name || "Anonymous"}
                    </p>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
