export async function POST(req: Request) {
  try {
    const { beschrijving } = await req.json();
    if (!beschrijving) return Response.json({ error: "Geen beschrijving" }, { status: 400 });

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) return Response.json({ error: "NVIDIA_API_KEY niet ingesteld" }, { status: 500 });

    const prompt = `Je bent assistent van Servr. Analyseer: "${beschrijving}"
Geef ENKEL geldige JSON terug:
{"categorie":"<Loodgieter|Elektricien|Schilder|Schoonmaak|Timmerman|Tuinman|HVAC|Slotenmaker|Dakdekker|Verhuizen>","urgentie":"<laag|middel|hoog>","titel":"<max 5 woorden>"}`;

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Nvidia API fout (${res.status}): ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return Response.json({ error: "Geen JSON in response: " + text }, { status: 500 });

    const result = JSON.parse(match[0]);
    return Response.json(result);

  } catch (e) {
    console.error("AI categorize error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
