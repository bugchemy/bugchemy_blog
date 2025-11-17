// supabase/functions/publish_ai_article/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.67.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function jsonResponse(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const ENABLE_MODERATION = (Deno.env.get("ENABLE_MODERATION") || "true") === "true";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ success: false, error: "Missing SUPABASE env vars" }, 500);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

  try {
    const body = await parseBody(req);
    const { jobId, access_token, review_notes } = body || {};

    if (!jobId) {
      return jsonResponse({ success: false, error: "jobId is required" }, 400);
    }

    if (!access_token) {
      return jsonResponse({ success: false, error: "access_token is required" }, 401);
    }

    // validate token -> get user
    const { data: userData, error: userErr } = await admin.auth.getUser(access_token);
    if (userErr || !userData?.user) {
      console.error("Auth getUser failed:", userErr);
      return jsonResponse({ success: false, error: "Invalid access_token" }, 401);
    }
    const user = userData.user;

    // Fetch job
    const { data: job, error: jobErr } = await admin
      .from("ai_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr) {
      console.error("Error fetching ai_job:", jobErr);
      return jsonResponse({ success: false, error: "Failed to fetch job" }, 500);
    }
    if (!job) {
      return jsonResponse({ success: false, error: "Job not found" }, 404);
    }

    if (job.status !== "completed") {
      return jsonResponse({ success: false, error: "Job is not completed and cannot be published" }, 400);
    }

    const resultJson = job.result_json ?? null;
    if (!resultJson || !resultJson.content) {
      return jsonResponse({ success: false, error: "Missing structured result_json.content in job" }, 400);
    }

    const title = (resultJson.title || job.title || job.topic || "").trim();
    const content = resultJson.content;
    const tagsFromResult = Array.isArray(resultJson.tags)
      ? resultJson.tags.map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(job.tags)
      ? job.tags.map((t: string) => String(t).trim()).filter(Boolean)
      : [];
    const image_url = resultJson.image_url || job.result_cover_url || null;
    const excerpt = resultJson.subtitle || job.result_outline || job.result_summary || null;

    if (!title) {
      return jsonResponse({ success: false, error: "Missing title in result_json" }, 400);
    }

    // Moderation
    if (ENABLE_MODERATION && openai) {
      try {
        const moderationResp = await openai.moderations.create({
          model: "omni-moderation-latest",
          input: `${title}\n\n${excerpt || ""}\n\n${content}`,
        });

        const results = (moderationResp as any).results?.[0];
        if (results?.flagged) {
          console.warn("Moderation blocked content:", results);
          return jsonResponse({
            success: false,
            error: "Content failed moderation check",
            moderation: results,
          }, 403);
        }
      } catch (modErr) {
        console.warn("Moderation failed:", modErr);
        // continue on moderation errors (non-blocking) but log
      }
    }

    // Tags upsert/collect ids
    const tagIds: number[] = [];

    // fetch existing tags
    if (tagsFromResult.length > 0) {
      const { data: foundTags, error: findErr } = await admin
        .from("tags")
        .select("id, name")
        .in("name", tagsFromResult)
        .limit(1000);

      if (findErr) {
        console.error("Error finding tags:", findErr);
        return jsonResponse({ success: false, error: "Failed to query tags" }, 500);
      }

      const existingNameToId: Record<string, number> = {};
      (foundTags || []).forEach((t: any) => {
        existingNameToId[t.name.toLowerCase()] = t.id;
      });

      for (const t of tagsFromResult) {
        const lower = t.toLowerCase();
        if (existingNameToId[lower]) {
          tagIds.push(existingNameToId[lower]);
          continue;
        }
        // create tag
        const { data: inserted, error: insertErr } = await admin
          .from("tags")
          .insert({ name: t })
          .select("id")
          .limit(1)
          .maybeSingle();
        if (insertErr) {
          // race — try fetch again
          const { data: recheck } = await admin
            .from("tags")
            .select("id, name")
            .eq("name", t)
            .limit(1)
            .maybeSingle();
          if (recheck && recheck.id) {
            tagIds.push(recheck.id);
          } else {
            console.error("Failed to insert or find tag:", t, insertErr);
          }
        } else if (inserted && inserted.id) {
          tagIds.push(inserted.id);
          existingNameToId[lower] = inserted.id;
        }
      }
    }

    // Unique slug
    const baseSlug = slugify(title).slice(0, 190) || `article-${Date.now()}`;
    let slug = baseSlug;
    let attempt = 1;
    while (true) {
      const { data: sdata, error: sErr } = await admin
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .limit(1);

      if (sErr) {
        console.error("Error checking slug uniqueness:", sErr);
        return jsonResponse({ success: false, error: "Failed to check slug uniqueness" }, 500);
      }

      if (!sdata || (Array.isArray(sdata) && sdata.length === 0)) break;

      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
      if (attempt > 50) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    // Insert article
    const nowIso = new Date().toISOString();
    const articlePayload: any = {
      author_id: user?.id ?? null,
      title,
      slug,
      content,
      excerpt,
      cover_url: image_url,
      status: "published",
      visibility: "public",
      published_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data: insertedArticles, error: insertArticleErr } = await admin
      .from("articles")
      .insert(articlePayload)
      .select("id")
      .maybeSingle();

    if (insertArticleErr || !insertedArticles?.id) {
      console.error("Error inserting article:", insertArticleErr);
      return jsonResponse({ success: false, error: "Failed to insert article" }, 500);
    }

    const articleId = insertedArticles.id;

    // article_tags mapping
    for (const tid of tagIds) {
      const { error: linkErr } = await admin
        .from("article_tags")
        .insert({ article_id: articleId, tag_id: tid });
      if (linkErr) {
        console.warn("Link insert warning:", linkErr);
      }
    }

    // Update job
    const { error: jobUpdateErr } = await admin
      .from("ai_jobs")
      .update({
        status: "published",
        article_id: articleId,
        reviewed_by: user?.id ?? null,
        review_notes: review_notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (jobUpdateErr) {
      console.error("Failed to update ai_jobs after publish:", jobUpdateErr);
      return jsonResponse({
        success: true,
        warning: "Article published but failed to update ai_jobs row",
        articleId,
      });
    }

    return jsonResponse({ success: true, articleId });
  } catch (err) {
    console.error("Unexpected error in publish_ai_article:", err);
    return jsonResponse({
      success: false,
      error: "Unexpected server error",
      details: String(err),
    }, 500);
  }
});
