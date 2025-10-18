import { supabase } from "@/lib/supabaseClient"

export async function getArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      cover_url,
      published_at,
      profiles ( display_name, avatar_url ),
      article_tags ( tags ( name ) )
    `)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching articles:", error)
    return []
  }

  return data.map((a: any) => ({
    ...a,
    author: { 
      name: a.profiles?.display_name ?? "Bugchemy", 
      avatar: a.profiles?.avatar_url ?? null 
    },
    tags: a.article_tags.map((at: any) => at.tags.name),
    date: a.published_at,
    updated: a.updated_at,
    readingTime: 5,
  }))
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      cover_url,
      published_at,
      updated_at,
      profiles ( display_name, avatar_url ),
      article_tags ( tags ( name ) ),
      comments (
        id,
        content,
        created_at,
        profiles ( display_name, avatar_url )
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("visibility", "public")
    .single()

  if (error) {
    console.error("Error fetching article:", error)
    return null
  }

  return {
    ...data,
    author: { 
      name: data.profiles?.display_name ?? "Bugchemy", 
      avatar: data.profiles?.avatar_url ?? null 
    },
    tags: data.article_tags.map((at: any) => at.tags.name),
    comments: data.comments.map((c: any) => ({
      ...c,
      user: { 
        name: c.profiles?.display_name, 
        avatar: c.profiles?.avatar_url 
      }
    }))
  }
}
