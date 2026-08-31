import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Inlined as a data URI: the renderer has no origin to resolve "/brand/..."
  // against at build time, and a relative src silently renders nothing.
  const mark = await readFile(// The card is drawn on #08090b, so it takes the dark cut.
    path.join(process.cwd(), "public", "brand", "mark-dark@1024.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#08090b",
          backgroundImage:
            "radial-gradient(900px circle at 12% -10%, rgba(245,165,36,0.28), transparent 60%)",
          color: "#f2f3f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={markSrc} width={56} height={56} alt="" style={{ borderRadius: 16 }} />
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>
            NorthStackHub
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            We build software end to end.
          </div>
          <div style={{ fontSize: 28, color: "#8b9099", maxWidth: 880, lineHeight: 1.4 }}>
            Web &amp; mobile applications · RAG and agentic AI systems · e-commerce · payments ·
            learning platforms · cloud &amp; maintenance
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#8b9099",
            borderTop: "1px solid #1e2127",
            paddingTop: 28,
          }}
        >
          <div>{siteConfig.domain}</div>
          <div style={{ letterSpacing: 2, textTransform: "uppercase", fontSize: 20 }}>
            One at a time · Built to last · No chasing
          </div>
        </div>
      </div>
    ),
    size,
  );
}
