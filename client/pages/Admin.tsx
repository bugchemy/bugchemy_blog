import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Markdown from "@/components/Markdown";
import { Content, Post, Snippet } from "@/lib/content";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function Admin() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string>("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("# Hello Bugchemy!\n\n```ts\nconsole.log('Hello, world!')\n```\n");
  const [author, setAuthor] = useState("Saurabh Katiyal");

  const slug = useMemo(() => slugify(title), [title]);

  const [snipName, setSnipName] = useState("");
  const [snipLang, setSnipLang] = useState("typescript");
  const [snipCode, setSnipCode] = useState("console.log('Bugchemy');\n");
  const [customSlug, setCustomSlug] = useState("");

  const [posts, setPosts] = useState<Post[]>(Content.getPosts());
  const [snippets, setSnippets] = useState<Snippet[]>(Content.getSnippets());
  const [fsOpen, setFsOpen] = useState(false);
  const [tab, setTab] = useState("new");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => {
      setPosts(Content.getPosts());
      setSnippets(Content.getSnippets());
    };
    window.addEventListener("bugchemy:content:update", handler as any);
    return () => window.removeEventListener("bugchemy:content:update", handler as any);
  }, []);

  const savePost = () => {
    const effectiveSlug = (customSlug || slug).trim();
    const post = Content.upsertPost({
      id: editingId ?? undefined,
      slug: effectiveSlug || slug,
      title,
      excerpt,
      author: { name: author },
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      cover,
      content,
    });
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setTags("");
    setCover("");
    setContent("");
    setPosts(Content.getPosts());
    setTab("all");
    alert(`${editingId ? "Updated" : "Saved"}: ${post.title}`);
  };

  const saveSnippet = () => {
    Content.upsertSnippet({ name: snipName, language: snipLang, code: snipCode });
    setSnipName("");
    setSnipCode("");
  };

  const exportData = () => {
    const data = JSON.stringify(Content.export(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bugchemy-content.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    const text = await file.text();
    const db = JSON.parse(text);
    Content.import(db);
    setPosts(Content.getPosts());
    setSnippets(Content.getSnippets());
  };

  const insertSnippet = (s: Snippet) => {
    const block = `\n\n\u0060\u0060\u0060${s.language}\n${s.code}\n\u0060\u0060\u0060\n`;
    setContent((c) => c + block);
  };

  return (
    <Layout>
      <SEO title="Bugchemy Admin" description="Create posts and manage code snippets" />
      <section className="container px-4 py-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={fsOpen} onOpenChange={setFsOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">Full Screen Preview</Button>
              </DialogTrigger>
              <DialogContent className="max-w-none w-screen h-screen sm:rounded-none p-0">
                <div className="h-full flex flex-col">
                  <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-6 py-3 flex items-center justify-between">
                    <DialogTitle className="font-semibold">Live Preview</DialogTitle>
                    <div className="text-xs text-muted-foreground">/{slug || 'untitled'}</div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <article className="container py-8">
                      <div className="prose prose-slate dark:prose-invert max-w-none prose-code:font-mono prose-pre:bg-transparent">
                        <Markdown content={content} />
                      </div>
                    </article>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => Content.clear()}>Clear All</Button>
            <Button variant="outline" onClick={exportData}>Export JSON</Button>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importData(e.target.files[0])} />
              <span className="rounded-md border px-3 py-2 cursor-pointer">Import JSON</span>
            </label>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList className="w-full overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="new">{editingId ? "Edit Post" : "New Post"}</TabsTrigger>
            <TabsTrigger value="snippets">Snippets</TabsTrigger>
            <TabsTrigger value="all">All Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-6 lg:col-span-2">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
                  </div>
                  <div>
                    <Label htmlFor="content">Content (Markdown + GFM)</Label>
                    <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="font-mono" />
                  </div>
                </div>
              </Card>

              <div className="grid gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base font-semibold">Post settings</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setFsOpen(true)}>Preview</Button>
                      <Button size="sm" onClick={savePost}>{editingId ? "Update" : "Publish"}</Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary" rows={3} />
                    </div>
                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ai, devops, logs" />
                    </div>
                    <div>
                      <Label htmlFor="slug">Custom slug (optional)</Label>
                      <Input id="slug" placeholder={slug || 'generated-from-title'} value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} />
                      <p className="mt-1 text-xs text-muted-foreground">Current: <span className="font-mono">/{(customSlug || slug) || '—'}</span></p>
                    </div>
                    <div>
                      <Label htmlFor="cover">Header image URL</Label>
                      <Input id="cover" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://..." />
                      {cover ? (
                        <div className="mt-2 rounded-md border overflow-hidden">
                          <img src={cover} alt="Header preview" className="max-h-40 w-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-base font-semibold">Live preview</h3>
                  <div className="mt-4 prose prose-slate dark:prose-invert max-w-none">
                    <Markdown content={content} />
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="snippets" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="sname">Name</Label>
                    <Input id="sname" value={snipName} onChange={(e) => setSnipName(e.target.value)} placeholder="Snippet name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="slang">Language</Label>
                      <Input id="slang" value={snipLang} onChange={(e) => setSnipLang(e.target.value)} placeholder="typescript, python, bash, ..." />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="scode">Code</Label>
                    <Textarea id="scode" value={snipCode} onChange={(e) => setSnipCode(e.target.value)} rows={12} className="font-mono" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveSnippet}>Save Snippet</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold">Saved Snippets</h3>
                <div className="mt-4 grid gap-3">
                  {snippets.map((s) => (
                    <div key={s.id} className="rounded-md border p-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-medium flex items-center gap-2">
                          {s.name}
                          <Badge variant="secondary" className="capitalize bg-accent/15 text-accent">{s.language}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => insertSnippet(s)}>Insert</Button>
                          <Button size="sm" variant="destructive" onClick={() => Content.deleteSnippet(s.id)}>Delete</Button>
                        </div>
                      </div>
                      <pre className="mt-3 overflow-x-auto text-xs"><code>{s.code}</code></pre>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4">
              {posts.map((p) => (
                <div key={p.id} className="rounded-lg border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground">/{p.slug} • {p.readingTime} min • {p.tags.join(', ')}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => (window.location.href = `/blog/${p.slug}`)}>Open</Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditingId(p.id); setTitle(p.title); setExcerpt(p.excerpt); setAuthor(p.author.name); setTags(p.tags.join(', ')); setCover(p.cover || ''); setContent(p.content); setTab('new'); }}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => Content.deletePost(p.id)}>Delete</Button>
                  </div>
                </div>
              ))}
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts yet. Create one in the New Post tab.</p>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}
