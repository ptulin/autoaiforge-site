import { getAllTools } from "@/lib/github";
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://aitools.disruptiveexperience.com";

  const { tools } = await getAllTools();

  // Most recent 50 tools
  const recent = [...tools]
    .sort((a, b) => new Date(b.generated).getTime() - new Date(a.generated).getTime())
    .slice(0, 50);

  const escXml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const items = recent
    .map((tool) => {
      const url = `${SITE_URL}/tool/${tool.date}/${tool.tool_name}`;
      const pubDate = new Date(tool.generated).toUTCString();
      return `
    <item>
      <title>${escXml(tool.display_name)}</title>
      <link>${escXml(url)}</link>
      <guid isPermaLink="true">${escXml(url)}</guid>
      <description>${escXml(tool.description)}</description>
      <category>${escXml(tool.topic)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`.trim();
    })
    .join("\n    ");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Tools by AutoAIForge</title>
    <link>${SITE_URL}</link>
    <description>Fresh AI developer tools generated nightly from trending news. Free, open-source Python tools.</description>
    <language>en-us</language>
    <ttl>60</ttl>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
