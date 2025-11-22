"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { Trash2, Edit2, RefreshCcw } from "lucide-react";
import { Icon } from "@iconify/react";
import { LogoLoader } from "@/components/LogoLoader";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: number;
  name: string;
  excerpt?: string | null;
  icon?: string | null;
  article_count?: number;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export default function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [icon, setIcon] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const slug = slugify(name);
  const { toast } = useToast();
  // 🧭 Fetch all tags with article counts
  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data: tagData, error } = await supabase
        .from("tags")
        .select("id, name, excerpt, icon");
      if (error) throw error;

      // Get article counts for each tag
      const { data: tagLinks, error: linkErr } = await supabase
        .from("article_tags")
        .select("tag_id, article_id");
      if (linkErr) throw linkErr;

      const counts: Record<number, number> = {};
      tagLinks?.forEach((l) => {
        counts[l.tag_id] = (counts[l.tag_id] || 0) + 1;
      });

      const combined = tagData.map((t) => ({
        ...t,
        article_count: counts[t.id] || 0,
      }));

      setTags(combined);
    } catch (err) {
      console.error("Error fetching tags:", err);
       toast({
        title: "Error fetching tags",
        description: err?.message || "Something went wrong tags.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // ➕ Create or update tag
  const handleSubmit = async () => {
    if (!name.trim()) return alert("Tag name is required");

    try {
      if (editingId) {
        const { error } = await supabase
          .from("tags")
          .update({ name, excerpt, icon })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tags")
          .insert({ name, excerpt, icon });
        if (error) throw error;
      }
      setName("");
      setExcerpt("");
      setIcon("");
      setEditingId(null);
      fetchTags();
      toast({
        title: "Tag Updated.",
        description: `${name}`,
        variant: "default",
      });
    } catch (err: any) {
      console.error("Error saving tag:", err);
      //alert(err.message || "Error saving tag");
      toast({
        title: "Error saving tags",
        description: err?.message || "Something went wrong saving tags.",
        variant: "destructive",
      });
    }
  };

  // 🗑 Delete tag
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this tag and remove all article relations?")) return;

    try {
      await supabase.from("article_tags").delete().eq("tag_id", id);
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
      fetchTags();
      toast({
        title: "Tag Deleted",
        variant: "destructive",
      });
    } catch (err: any) {
      console.error("Error deleting tag:", err);
      alert(err.message || "Error deleting tag");
       toast({
        title: "Error deleting tags",
        description: err?.message || "Something went deleting tags.",
        variant: "destructive",
      });
    }
  };

  // ✏️ Edit tag
  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setExcerpt(tag.excerpt || "");
    setIcon(tag.icon || "");
  };

  // 🚫 Cancel edit
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
          <h3 className="text-base sm:text-lg font-semibold">
            {editingId ? "Edit Tag" : "Create New Tag"}
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchTags}
            disabled={loading}
            className="text-xs flex items-center gap-1"
          >
            <RefreshCcw className="w-3 h-3" /> Refresh
          </Button>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="tag-name">Tag Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., JavaScript"
            />
            {name && (
              <p className="text-xs text-muted-foreground mt-1">
                Slug: <span className="font-mono">{slug}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="tag-excerpt">Description (optional)</Label>
            <Textarea
              id="tag-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description for this tag"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="tag-icon">Icon URL (optional)</Label>
            <Input
              id="tag-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="devicon:react"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              {editingId ? "Update Tag" : "Create Tag"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* TAG LIST */}
      <div className="grid gap-3">
        <h3 className="text-base sm:text-lg font-semibold">
          Tags ({tags.length})
        </h3>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? <LogoLoader /> : "No tags found."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Card key={tag.id} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{tag.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Articles: <strong>{tag.article_count}</strong>
                      </p>
                    </div>
                    {tag.icon ? (
                     <Icon icon={tag.icon} className="text-2xl text-primary" />
                    ):(
                      <span className="text-2xl">🧩</span>
                    )}
                    
                  </div>
                  {tag.excerpt && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                      {tag.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
