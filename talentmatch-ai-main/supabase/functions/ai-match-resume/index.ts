const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callAI(messages: any[], tool: any): Promise<any> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", messages, tools: [tool],
      tool_choice: { type: "function", function: { name: tool.function.name } },
    }),
  });
  if (r.status === 429) throw new Error("Rate limit exceeded.");
  if (r.status === 402) throw new Error("AI credits exhausted.");
  if (!r.ok) throw new Error(`AI error: ${r.status}`);
  const data = await r.json();
  return JSON.parse(data.choices[0].message.tool_calls?.[0]?.function?.arguments || "{}");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { resumeText, jobTitle, jobDescription, requiredSkills } = await req.json();
    const result = await callAI([
      { role: "system", content: "You are an expert technical recruiter. Score how well a resume matches a job. Be objective." },
      { role: "user", content: `JOB: ${jobTitle}\n\nDESCRIPTION:\n${jobDescription}\n\nREQUIRED SKILLS: ${(requiredSkills || []).join(", ")}\n\nRESUME:\n${(resumeText || "").slice(0, 12000)}\n\nReturn match score 0-100, matched skills, missing skills, and 1-2 sentence rationale.` },
    ], {
      type: "function",
      function: {
        name: "score_match",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number" },
            matched: { type: "array", items: { type: "string" } },
            missing: { type: "array", items: { type: "string" } },
            rationale: { type: "string" },
          },
          required: ["score", "matched", "missing", "rationale"],
        },
      },
    });
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
