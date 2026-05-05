const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callAI(messages: any[], tool: any) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, tools: [tool], tool_choice: { type: "function", function: { name: tool.function.name } } }),
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
    const { resumeText, jobDescription } = await req.json();
    const prompt = jobDescription
      ? `Analyze this resume against the JOB DESCRIPTION. Provide ATS score 0-100, extracted skills, missing skills relative to the JD, and concrete improvement suggestions.\n\nJOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${(resumeText || "").slice(0, 12000)}`
      : `Analyze this resume for general ATS readiness. Provide ATS score 0-100, extracted skills, gaps that hurt ATS scoring, and concrete improvements.\n\nRESUME:\n${(resumeText || "").slice(0, 12000)}`;
    const result = await callAI([
      { role: "system", content: "You are an ATS expert and career coach. Be rigorous and specific." },
      { role: "user", content: prompt },
    ], {
      type: "function",
      function: {
        name: "analyze_resume",
        parameters: {
          type: "object",
          properties: {
            ats_score: { type: "number" },
            extracted_skills: { type: "array", items: { type: "string" } },
            missing_skills: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["ats_score", "extracted_skills", "missing_skills", "suggestions", "summary"],
        },
      },
    });
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
