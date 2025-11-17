// supabase/functions/generate_ai_article/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.67.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS - allow headers usually sent by supabase-js
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Helper: upload image to Supabase Storage (keeps your original)
async function uploadImageToSupabase(supabase: any, imageUrl: string, topic: string) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const file = new Uint8Array(arrayBuffer);
    const fileName = `${topic.replace(/\s+/g, "_")}_${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from("article-covers")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/png",
      });

    if (error) {
      console.error("❌ Upload failed:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("article-covers")
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl ?? null;
  } catch (err) {
    console.error("❌ Upload error:", err);
    return null;
  }
}

async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

serve(async (req: Request) => {
  // CORS preflight handler
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const UNSPLASH_FALLBACK = Deno.env.get("UNSPLASH_FALLBACK") || "https://source.unsplash.com/1024x512/?technology";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing environment variables" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    const { topic, tone, length, tags } = await parseBody(req);
    if (!topic) {
      return new Response(JSON.stringify({ success: false, error: "Missing topic" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const jobId = crypto.randomUUID();
    console.log(`🧠 Generating AI article for: ${topic}`);

    // Build prompt (you can adjust further)
    /**const prompt = `
Write a ${length?.toLowerCase() || "medium"}-length technical blog article about "${topic}".
Tone: ${tone || "Professional"}.
Output a JSON object ONLY with keys: title, subtitle, content, tags (array), reading_duration (minutes), image_prompts (array).
- 'content' must be Markdown.
- Keep tags as short strings (no special chars).
Return only the JSON object.
Tags suggestion: ${Array.isArray(tags) ? tags.join(", ") : ""}.
`;**/



const prompt = `
Write a ${length?.toLowerCase() || "medium"}-length technical blog article about "${topic}".
Tone: ${tone || "Professional"}.

RETURN ONLY a JSON object with keys:
{
  "title": string,
  "subtitle": string,
  "content": string,    // MUST be Markdown only (no HTML)
  "tags": string[],     // lowercase, simple
  "reading_duration": number, // minutes
  "image_prompts": string[]
}

IMPORTANT STRICT RULES — MARKDOWN OUTPUT (read carefully):

1) NO HTML at all. Markdown only.
2) Use headings: #, ##, ### (max 3 levels).
3) Paragraphs must be separated by a single blank line.
4) Inline Technical Tokens (NON-MARKDOWN SYNTAX — CRITICAL):
   - DO NOT use Markdown backticks for inline code.
   - Instead, wrap inline technical words using this safe delimiter:
       ⟦git⟧, ⟦JAVA_HOME⟧, ⟦.bashrc⟧, ⟦PATH⟧
   - Rules for ⟦token⟧ syntax:
       a) No spaces inside: ⟦JAVA_HOME⟧ (correct), ⟦ JAVA_HOME ⟧ (incorrect)
       b) MUST never contain newlines, tabs, or invisible separators (U+2028/U+2029)
       c) MUST stay on the same line as the surrounding text
   - The ⟦token⟧ syntax is ALWAYS inline and must never appear alone on a separate lin
   - **Inline code MUST NOT contain any newline or hidden separator (U+2028, U+2029, CR/LF).** Keep inline tokens on the same line.
   - For multi-line commands or examples use fenced code blocks with language tag, e.g.:
     \`\`\`bash
     dmesg | grep error
     \`\`\`
   - Put one blank line before and after every fenced block.
5) NEVER put inline backticks on their own line. Example:
   - CORRECT: Use \`git\` to manage repos.
   - INCORRECT:
     \`git\`
     to manage repos.
6) Lists: use "-" or "1." only. No nested deeper than 2 levels.
7) Images: use Markdown syntax: ![alt](URL "caption") — URL may be placeholder.
8) Tables: valid GitHub-flavored Markdown only.
9) Tags: return up to 6 tags, lowercase, no special chars.
10) Do not escape \\n — use real newlines for paragraphs only.
11) Do NOT include any invisible/control characters inside inline code. If necessary, remove them.
12) Output MUST be parseable JSON (no stray text outside JSON).
13) This is generated to be a part of technical blog make it have amazing user experiance while reading.

Suggested tags: ${Array.isArray(tags) ? tags.join(", ") : ""}

Return ONLY the JSON object (no extra commentary).
`;

    // Insert initial ai_job row with status processing
    await supabase.from("ai_jobs").insert({
      id: jobId,
      topic,
      tone,
      length,
      tags,
      prompt,
      status: "processing",
      started_at: new Date().toISOString(),
    });

    // Run model (chat completion)
    const model = "gpt-4o-mini";
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an expert software engineer and technical blogger." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // If model didn't strictly output JSON, try to extract JSON block
      const jsonMatch = raw.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {}
      }
    }

    // Fallback to text if parsing fails
    const resultText = parsed?.content ? parsed.content : (completion.choices?.[0]?.message?.content ?? "No content generated.");

    // Generate or fallback image
    let imageUrl: string | null = null;
    try {
      const imagePrompt = `A clean, professional, minimalistic blog cover image about "${topic}", ${tone || "Professional"} tone.`;
      const image = await openai.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x512",
      });
      imageUrl = image.data?.[0]?.url ?? null;
    } catch (imgErr) {
      console.warn("⚠️ Image generation failed, fallback to Unsplash.", imgErr);
      imageUrl = `${UNSPLASH_FALLBACK}`;
    }

    const storedUrl = await uploadImageToSupabase(supabase, imageUrl, topic);
    const finalImageUrl = storedUrl || imageUrl;

    // Build result_json safely
    const result_json = {
      title: parsed?.title || parsed?.headline || topic,
      subtitle: parsed?.subtitle || parsed?.subtitle_text || null,
      content: parsed?.content || resultText,
      tags: Array.isArray(parsed?.tags) ? parsed.tags : (Array.isArray(tags) ? tags : []),
      reading_duration: parsed?.reading_duration ?? null,
      image_url: parsed?.image_url ?? finalImageUrl,
      model,
    };

    // Update ai_job row with results
    await supabase
      .from("ai_jobs")
      .update({
        status: "completed",
        model,
        result_summary: typeof resultText === "string" ? resultText : null,
        result_cover_url: finalImageUrl,
        result_outline: `Generated article about ${topic}.`,
        result_json,
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`✅ Job ${jobId} completed`);

    return new Response(JSON.stringify({ success: true, jobId, model, imageUrl: finalImageUrl }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
