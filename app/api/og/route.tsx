import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "AI Developer Tool";
  const topic = searchParams.get("topic") || "AI Tools";
  const rating = parseFloat(searchParams.get("rating") || "0");
  const downloads = parseInt(searchParams.get("downloads") || "0", 10);
  const desc = searchParams.get("desc") || "";

  const starsFull = Math.min(5, Math.round(rating));
  const starStr = "★".repeat(starsFull) + "☆".repeat(5 - starsFull);
  const hasStats = rating > 0 || downloads > 0;
  const descTrunc = desc.length > 115 ? desc.slice(0, 115) + "…" : desc;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #050914 0%, #0d1424 60%, #111c35 100%)",
          padding: "56px 70px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: "relative",
        }}
      >
        {/* Grid texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(30,45,74,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,74,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top: logo + topic badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: 38 }}>🤖</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, lineHeight: "1.2" }}>
                AutoAIForge
              </span>
              <span style={{ color: "#60a5fa", fontSize: 13, lineHeight: "1.2" }}>
                AI Developer Tools
              </span>
            </div>
          </div>
          <div
            style={{
              background: "rgba(37,99,235,0.2)",
              border: "1px solid rgba(59,130,246,0.4)",
              borderRadius: 20,
              padding: "6px 18px",
              color: "#93c5fd",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {topic}
          </div>
        </div>

        {/* Center: Tool title + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, zIndex: 1 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: title.length > 40 ? 40 : 52,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
          {descTrunc && (
            <div
              style={{
                color: "#94a3b8",
                fontSize: 19,
                lineHeight: 1.5,
                maxWidth: "860px",
              }}
            >
              {descTrunc}
            </div>
          )}
        </div>

        {/* Bottom: stats + badge + URL */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Stats row */}
            {hasStats && (
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {rating > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#fbbf24", fontSize: 24, letterSpacing: 1 }}>
                      {starStr}
                    </span>
                    <span style={{ color: "#fbbf24", fontSize: 20, fontWeight: 700 }}>
                      {rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {downloads > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#4ade80", fontSize: 20 }}>⬇</span>
                    <span style={{ color: "#4ade80", fontSize: 18, fontWeight: 600 }}>
                      {formatCount(downloads)} downloads
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* Open source badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>
                OPEN SOURCE · FREE TO USE · AUTO-GENERATED
              </span>
            </div>
          </div>
          <span style={{ color: "#475569", fontSize: 15 }}>
            aitools.disruptiveexperience.com
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
