import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.67.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Helper: upload image to Supabase Storage
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

// Common headers (used in all responses)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Main Edge Function
serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const UNSPLASH_FALLBACK = "https://source.unsplash.com/1024x512/?technology";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing environment variables" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    const { topic, tone, length, tags } = await req.json();
    if (!topic)
      return new Response(
        JSON.stringify({ success: false, error: "Missing topic" }),
        { status: 400, headers: corsHeaders }
      );

    const jobId = crypto.randomUUID();
    console.log(`🧠 Generating AI article for: ${topic}`);

    const prompt = `
Write a ${length?.toLowerCase() || "medium"}-length technical blog article about "${topic}".
Tone: ${tone || "Professional"}.
Use Markdown formatting, code examples (TypeScript, JavaScript, or Python),
and a clear structure (Introduction, Example, Conclusion).
Tags: ${tags?.join(", ") || "none"}.
`;

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

    const model = "gpt-4o-mini";
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an expert software engineer and technical blogger." },
        { role: "user", content: prompt },
      ],
    });

    const resultText = completion.choices[0]?.message?.content || "No content generated.";

    let imageUrl: string | null = null;
    try {
      const imagePrompt = `A clean, professional, minimalistic blog cover image about "${topic}", ${tone} tone.`;
      const image = await openai.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x512",
      });
      imageUrl = image.data?.[0]?.url ?? null;
    } catch {
      console.warn("⚠️ Image generation failed, fallback to Unsplash.");
      imageUrl = `${UNSPLASH_FALLBACK},${encodeURIComponent(topic)}`;
    }

    const storedUrl = await uploadImageToSupabase(supabase, imageUrl, topic);
    const finalImageUrl = storedUrl || imageUrl;

    await supabase
      .from("ai_jobs")
      .update({
        status: "completed",
        model,
        result_summary: resultText,
        result_cover_url: finalImageUrl,
        result_outline: `Generated article about ${topic}.`,
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`✅ Job ${jobId} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, jobId, model, imageUrl: finalImageUrl }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
