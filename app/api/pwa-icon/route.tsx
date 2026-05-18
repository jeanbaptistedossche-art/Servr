import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get("size") ?? "512");
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.56);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0F6E56 0%, #064d3b 100%)",
          borderRadius: `${radius}px`,
        }}
      >
        {/* Subtle inner glow */}
        <div
          style={{
            position: "absolute",
            width: `${Math.round(size * 0.65)}px`,
            height: `${Math.round(size * 0.65)}px`,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
          }}
        />
        <span
          style={{
            fontSize,
            fontWeight: "bold",
            color: "white",
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1,
            position: "relative",
          }}
        >
          S
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
