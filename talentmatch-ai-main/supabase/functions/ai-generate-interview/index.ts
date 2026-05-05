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
    const { domain, difficulty, count } = await req.json();
    const result = await callAI([
      { role: "system", content: "You are a senior interviewer. Generate practical, conceptual interview questions appropriate to difficulty." },
      { role: "user", content: `Generate ${count || 5} ${difficulty} interview questions for: ${domain}. Mix of conceptual and applied. For each, list 4-6 expected keywords/concepts a strong answer would mention.` },
    ], {
      type: "function",
      function: {
        name: "generate_questions",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  expected_keywords: { type: "array", items: { type: "string" } },
                },
                required: ["question", "expected_keywords"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
