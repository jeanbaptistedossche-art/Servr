import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0F6E56 0%, #064d3b 100%)",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "white",
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
