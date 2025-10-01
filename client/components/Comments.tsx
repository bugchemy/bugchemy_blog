import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const KEY = "bugchemy.comments.v1";

type Comment = {
  id: string;
  name: string;
  message: string;
  date: string;
};

function readAll(): Record<string, Comment[]> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, Comment[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(db: Record<string, Comment[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export default function Comments({ slug }: { slug: string }) {
  const [db, setDb] = useState<Record<string, Comment[]>>({});
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDb(readAll());
  }, []);

  const comments = db[slug] || [];

  const add = () => {
    if (!name.trim() || !message.trim()) return;
    const next: Comment = {
      id: crypto.randomUUID(),
      name: name.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
    };
    const updated = { ...db, [slug]: [next, ...comments] };
    setDb(updated);
    writeAll(updated);
    setMessage("");
  };

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">Comments</h2>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="md:col-span-2">
              <Textarea rows={3} placeholder="Share your thoughts…" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <div>
            <Button onClick={add}>Post comment</Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{new Date(c.date).toLocaleString()}</div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{c.message}</p>
            </div>
          ))}
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Be the first to comment.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
