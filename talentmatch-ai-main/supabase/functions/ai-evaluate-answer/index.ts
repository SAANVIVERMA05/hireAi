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
    const { question, expectedKeywords, answer, domain } = await req.json();
    const result = await callAI([
      { role: "system", content: "You are a fair, technical interviewer. Score answers 0-10 based on accuracy, depth, and coverage of key concepts. Give 1-2 sentence feedback." },
      { role: "user", content: `Domain: ${domain}\nQuestion: ${question}\nKey concepts to look for: ${(expectedKeywords || []).join(", ")}\n\nCandidate answer:\n${answer || "(no answer given)"}\n\nScore 0-10 and give brief feedback.` },
    ], {
      type: "function",
      function: {
        name: "evaluate",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
          },
          required: ["score", "feedback"],
        },
      },
    });
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
