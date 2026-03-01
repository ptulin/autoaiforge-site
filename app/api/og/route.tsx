import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "AI Developer Tool";
  const topic = searchParams.get("topic") || "AI Tools";

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
          padding: "60px 70px",
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
            <span style={{ fontSize: 36 }}>🤖</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, lineHeight: "1.2" }}>
                AI Tools
              </span>
              <span style={{ color: "#60a5fa", fontSize: 14, lineHeight: "1.2" }}>
                by AutoAIForge
              </span>
            </div>
          </div>
          <div
            style={{
              background: "rgba(37,99,235,0.2)",
              border: "1px solid rgba(59,130,246,0.4)",
              borderRadius: 20,
              padding: "6px 16px",
              color: "#93c5fd",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {topic}
          </div>
        </div>

        {/* Center: Tool title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 1 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: title.length > 40 ? 42 : 52,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
              }}
            />
            <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 600, letterSpacing: "0.05em" }}>
              OPEN SOURCE · FREE TO USE · AUTO-GENERATED
            </span>
          </div>
        </div>

        {/* Bottom: URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <span style={{ color: "#475569", fontSize: 16 }}>
            aitools.disruptiveexperience.com
          </span>
          <span style={{ color: "#334155", fontSize: 14 }}>
            Generated nightly by AI
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
