"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/Modal";
import ArticleSearchModal from "./ArticleSearchModal";
import { LogoLoader } from "@/components/LogoLoader";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { GripVertical, Trash2, PlusCircle } from "lucide-react";

// -----------------------
// Types
// -----------------------
interface FeaturedArticle {
  id: string;
  article_id: string;
  title: string;
  cover_url?: string;
  position: number;
}

export default function FeaturedArticleManager() {
  const [featured, setFeatured] = useState<FeaturedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchFeatured();
  }, []);

  // Fetch and normalize existing featured articles
  async function fetchFeatured() {
    setLoading(true);
    const { data, error } = await supabase
      .from("featured_articles")
      .select(`id, article_id, position, articles(title, cover_url)`)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading featured:", error);
      setLoading(false);
      return;
    }

    // Map data correctly
    const mapped = (data || []).map((item: any) => ({
      id: item.id,
      article_id: item.article_id,
      title: item.articles?.title || "Untitled",
      cover_url: item.articles?.cover_url || "",
      position: item.position,
    }));

    // Normalize positions if gaps exist
    normalizePositions(mapped);
    setLoading(false);
  }

  // 🔹 Normalize Positions (always renumber 1..n in correct order)
  async function normalizePositions(list?: FeaturedArticle[]) {
    const sorted = (list || [...featured]).sort(
      (a, b) => a.position - b.position
    );

    const normalized = sorted.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    setFeatured(normalized);

    // Bulk update to DB (better performance)
    await supabase.from("featured_articles").upsert(
      normalized.map((item) => ({
        id: item.id,
        position: item.position,
      }))
    );
  }

  // 🔹 Add Article - now automatically normalizes
  async function addFeatured(article: any) {
    if (featured.some((f) => f.article_id === article.id)) {
      alert("This article is already featured!");
      return;
    }

    await supabase.from("featured_articles").insert({
      article_id: article.id,
      position: featured.length + 1,
    });

    await fetchFeatured();
    setSearchModalOpen(false);
  }

  // 🔹 Delete Article - now auto-normalizes positions
  async function removeFeatured(id: string) {
    await supabase.from("featured_articles").delete().eq("id", id);
    await fetchFeatured();
  }

  // Drag-and-drop behavior
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = featured.findIndex((item) => item.id === active.id);
    const newIndex = featured.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(featured, oldIndex, newIndex).map(
      (item, idx) => ({
        ...item,
        position: idx + 1,
      })
    );

    normalizePositions(reordered);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Featured Articles</h2>
        <Button onClick={() => setSearchModalOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add Article
        </Button>
      </div>

      {loading ? (
              <div className="flex items-center justify-center h-screen text-lg">
                <LogoLoader />
              </div>
      ) : featured.length === 0 ? (
        <p>No featured articles. Add some!</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={featured.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {featured.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onRemove={removeFeatured}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Article Selection Modal */}
      {searchModalOpen && (
        <Modal onClose={() => setSearchModalOpen(false)}>
          <ArticleSearchModal
            onSelect={addFeatured}
            onClose={() => setSearchModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// -----------------------
// Sortable Item Component
// -----------------------
function SortableItem({
  item,
  onRemove,
}: {
  item: FeaturedArticle;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border p-3 bg-background shadow-sm"
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
        </button>
        <Badge variant="secondary">#{item.position}</Badge>
        <span>{item.title}</span>
      </div>
      <Button variant="destructive" size="sm" onClick={() => onRemove(item.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
