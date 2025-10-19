import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag } from "@/lib/content";
import { Trash2, Edit2 } from "lucide-react";

interface TagManagerProps {
  tags: Tag[];
  onAddTag: (tag: Omit<Tag, "id" | "createdAt">) => void;
  onDeleteTag: (id: number) => void;
  onUpdateTag: (id: number, tag: Omit<Tag, "id" | "createdAt">) => void;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function TagManager({
  tags,
  onAddTag,
  onDeleteTag,
  onUpdateTag,
}: TagManagerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const slug = slugify(name);

  const handleSubmit = () => {
    if (!name) return;

    const tagData = { name, slug, description };

    if (editingId) {
      onUpdateTag(editingId, tagData);
      setEditingId(null);
    } else {
      onAddTag(tagData);
    }

    setName("");
    setDescription("");
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setDescription(tag.description || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  return (
    <div className="grid gap-6">
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          {editingId ? "Edit Tag" : "Create New Tag"}
        </h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="tag-name" className="text-xs sm:text-sm">Tag Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., JavaScript, React, DevOps"
              className="text-xs sm:text-sm"
            />
            {name && (
              <p className="mt-1 text-xs text-muted-foreground">
                Slug: <span className="font-mono">{slug}</span>
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="tag-description" className="text-xs sm:text-sm">Description (optional)</Label>
            <Textarea
              id="tag-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this tag"
              rows={2}
              className="text-xs sm:text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSubmit} className="flex-1 sm:flex-none text-xs sm:text-sm">
              {editingId ? "Update Tag" : "Create Tag"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none text-xs sm:text-sm">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        <h3 className="text-base sm:text-lg font-semibold">Tags ({tags.length})</h3>
        {tags.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          <div className="grid gap-3">
            {tags.map((tag) => (
              <Card key={tag.id} className="p-3 sm:p-4">
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{tag.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Slug: <span className="font-mono">/{tag.slug}</span>
                    </div>
                    {tag.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        {tag.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(tag)}
                      className="text-xs"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteTag(tag.id)}
                      className="text-xs"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
