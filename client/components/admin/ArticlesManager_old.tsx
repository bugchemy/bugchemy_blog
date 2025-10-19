import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/lib/content";
import { Eye, EyeOff, Edit2, Trash2 } from "lucide-react";

interface ArticlesManagerProps {
  posts: Post[];
  onToggleVisibility: (id: string, visible: boolean) => void;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
  onCreateNew?: () => void;
}

export default function ArticlesManager({
  posts,
  onToggleVisibility,
  onEdit,
  onDelete,
  onCreateNew,
}: ArticlesManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md text-xs sm:text-sm min-w-[200px]"
        />
        {onCreateNew && (
          <Button size="sm" onClick={onCreateNew} className="text-xs sm:text-sm">
            + New Post
          </Button>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
          {posts.length === 0 ? "No articles yet." : "No matching articles."}
        </p>
      ) : (
        <div className="grid gap-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="p-3 sm:p-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h4 className="font-semibold text-sm sm:text-base line-clamp-2">{post.title}</h4>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {post.aiGenerated && (
                      <Badge variant="secondary" className="text-xs">
                        AI
                      </Badge>
                    )}
                    <Badge
                      variant={post.visible ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {post.visible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>/{post.slug} • {post.readingTime}m</div>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-accent/10 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div>
                    {new Date(post.updated).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onToggleVisibility(post.id, !post.visible)
                    }
                    title={post.visible ? "Hide article" : "Show article"}
                    className="text-xs"
                  >
                    {post.visible ? (
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(post)}
                    className="text-xs"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-1">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(post.id)}
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
  );
}
