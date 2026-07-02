import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Brandon Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const logo = readFileSync(
    join(process.cwd(), "public/brand/brandon-network-white.png"),
  );
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 90% at 50% 35%, #11243B 0%, #0B1B2E 70%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={620} alt="Brandon Network" />
        <div
          style={{
            marginTop: 40,
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#C2A15B",
          }}
        >
          Preservando tu legado
        </div>
      </div>
    ),
    { ...size },
  );
}
