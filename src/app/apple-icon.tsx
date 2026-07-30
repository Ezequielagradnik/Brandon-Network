import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ícono para Safari / iOS (pinned tabs, pantalla de inicio).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1B2E",
          color: "#D9C291",
          fontSize: 120,
          fontWeight: 600,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
