"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import  Modal  from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  cover_url?: string;
  published_at?: string;
  visibility?: string;
}

export default function ArticleSearchModal({ onClose, onSelect }: any) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPublishedArticles();
  }, []);

  async function fetchPublishedArticles() {
    const { data } = await supabase
      .from("articles")
      .select("id,title,excerpt,cover_url,published_at,visibility")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("published_at", { ascending: false });
    setArticles(data || []);
  }

  return (
    <Modal onClose={onClose} className="max-w-3xl">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Pick Article to Feature</h2>

        <Input
          placeholder="Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid gap-3 max-h-[400px] overflow-y-auto">
          {articles
            .filter((a) =>
              a.title.toLowerCase().includes(search.toLowerCase())
            )
            .map((article) => (
              <Card
                key={article.id}
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted"
                onClick={() => onSelect(article)}
              >
                <div>
                  <h3 className="font-medium">{article.title}</h3>
                  <p className="text-xs text-muted-foreground">{article.excerpt}</p>
                </div>
                <Button>Select</Button>
              </Card>
            ))}
        </div>
      </div>
    </Modal>
  );
}
