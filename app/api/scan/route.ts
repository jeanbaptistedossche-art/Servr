import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { imageBase64, mimeType } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: "Geen afbeelding" }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: (mimeType ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Je bent een Nederlandse vakman-assistent. Analyseer deze foto en geef een prijsschatting voor de reparatie of klus die je ziet.

Antwoord UITSLUITEND met een JSON-object, geen andere tekst ervoor of erna:

{
  "categorie": "naam van de dienst (bijv. Loodgieter, Schilder, Elektricien)",
  "beschrijving": "korte beschrijving van het probleem in 1 zin",
  "prijsMin": 50,
  "prijsMax": 150,
  "urgentie": "laag",
  "tijdschatting": "1-2 uur",
  "tips": ["praktische tip 1", "praktische tip 2"]
}

Regels:
- urgentie is exact "laag", "middel" of "hoog"
- prijsMin en prijsMax zijn getallen zonder euro-teken
- Als je geen reparatie of klus ziet, gebruik dan categorie "Algemeen" en geef een algemene schatting
- Altijd geldig JSON, nooit extra uitleg`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Probeer JSON te extraheren — ook als er tekst omheen staat
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI kon de foto niet analyseren. Probeer een duidelijkere foto." },
        { status: 500 }
      );
    }

    const json = JSON.parse(jsonMatch[0]);

    // Valideer verplichte velden
    if (!json.categorie || !json.prijsMin || !json.prijsMax) {
      return NextResponse.json(
        { error: "Onvolledig resultaat ontvangen. Probeer opnieuw." },
        { status: 500 }
      );
    }

    return NextResponse.json(json);
  } catch (err: unknown) {
    console.error("Scan error:", err);
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json(
      { error: `Fout: ${message}` },
      { status: 500 }
    );
  }
}
