import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { imageBase64, mimeType } = await req.json();

  if (!imageBase64) {
    return NextResponse.json({ error: "Geen afbeelding" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType ?? "image/jpeg", data: imageBase64 },
          },
          {
            type: "text",
            text: `Je bent een Nederlandse vakman-assistent. Analyseer deze foto van een reparatie of klus.
Geef een schatting in JSON-formaat:
{
  "categorie": "naam van de dienst",
  "beschrijving": "korte beschrijving van het probleem (max 1 zin)",
  "prijsMin": getal in euro,
  "prijsMax": getal in euro,
  "urgentie": "laag" | "middel" | "hoog",
  "tijdschatting": "bijv. 1-2 uur",
  "tips": ["tip1", "tip2"]
}
Antwoord ALLEEN met geldig JSON, geen extra tekst.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "Kon resultaat niet verwerken", raw: text }, { status: 500 });
  }
}
