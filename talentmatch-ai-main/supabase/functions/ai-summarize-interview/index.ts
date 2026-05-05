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
    const { domain, questions, tabSwitches } = await req.json();
    const transcript = (questions || []).map((q: any, i: number) =>
      `Q${i+1}: ${q.q}\nA: ${q.a || "(none)"}\nScore: ${q.score}/10 — ${q.fb}`
    ).join("\n\n");
    const result = await callAI([
      { role: "system", content: "You are a constructive interview coach. Give a holistic summary in 3-4 short paragraphs covering strengths, gaps, and concrete next steps." },
      { role: "user", content: `Domain: ${domain}\nTab switches detected: ${tabSwitches}\n\n${transcript}\n\nWrite the final feedback.` },
    ], {
      type: "function",
      function: {
        name: "summarize",
        parameters: { type: "object", properties: { feedback: { type: "string" } }, required: ["feedback"] },
      },
    });
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
