import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #f5a524, #c77b12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Drawn rather than typed: a ★ glyph forces a dynamic font fetch at build time. */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#08090b">
              <path d="M12 2l2.9 6.5 7 1.2-5 5 1.2 7L12 18.4 5.9 21.7l1.2-7-5-5 7-1.2L12 2z" />
            </svg>
          </div>
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
