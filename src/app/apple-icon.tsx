import { ImageResponse } from "next/og";

/**
 * iOS home-screen icon. Same mark as `icon.svg`, but Apple ignores SVG icons
 * and composites onto white, so this renders the amber tile as a PNG with the
 * corner radius baked in.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #f5a524 0%, #c77b12 100%)",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 6.5l2.4 5.4 5.6 1-4 4.1.9 5.9-4.9-2.8-4.9 2.8.9-5.9-4-4.1 5.6-1L16 6.5z"
            fill="#08090b"
            fillOpacity="0.92"
          />
        </svg>
      </div>
    ),
    size,
  );
}
