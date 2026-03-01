import { getAllTools } from "@/lib/github";
import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://aitools.disruptiveexperience.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { tools } = await getAllTools();

  const toolPages = tools.map((tool) => ({
    url: `${SITE_URL}/tool/${tool.date}/${tool.tool_name}`,
    lastModified: new Date(tool.generated),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...toolPages,
  ];
}
