import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
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
          background: "#0B1B2E",
          color: "#D9C291",
          fontSize: 46,
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
