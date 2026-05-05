const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callAI(messages: any[], tool?: any): Promise<any> {
  const body: any = { model: "google/gemini-2.5-flash", messages };
  if (tool) {
    body.tools = [tool];
    body.tool_choice = { type: "function", function: { name: tool.function.name } };
  }
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
  if (r.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
  if (!r.ok) throw new Error(`AI error: ${r.status}`);
  const data = await r.json();
  if (tool) {
    const args = data.choices[0].message.tool_calls?.[0]?.function?.arguments;
    return JSON.parse(args || "{}");
  }
  return data.choices[0].message.content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { filename, base64, mimeType } = await req.json();
    // Send to Gemini as inline data — it handles PDFs/images natively
    const isPdf = (mimeType || "").includes("pdf") || filename.toLowerCase().endsWith(".pdf");
    let messages: any[];
    if (isPdf) {
      messages = [
        { role: "system", content: "You extract structured info from resumes. Be accurate, concise." },
        { role: "user", content: [
          { type: "text", text: "Extract the candidate's resume text, skills (technologies/tools/languages), years of experience, and a 1-line headline." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ]},
      ];
    } else {
      const text = atob(base64);
      messages = [
        { role: "system", content: "You extract structured info from resumes." },
        { role: "user", content: `Extract from this resume:\n\n${text.slice(0, 20000)}` },
      ];
    }
    const result = await callAI(messages, {
      type: "function",
      function: {
        name: "extract_resume",
        description: "Extract resume info",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Full readable resume text" },
            skills: { type: "array", items: { type: "string" } },
            experience_years: { type: "number" },
            headline: { type: "string" },
          },
          required: ["text", "skills"],
        },
      },
    });
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
