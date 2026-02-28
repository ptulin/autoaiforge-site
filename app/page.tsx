import { getAllTools } from "@/lib/github";
import ToolsClient from "@/components/ToolsClient";

export const revalidate = 3600; // ISR: rebuild every hour

export default async function HomePage() {
  const data = await getAllTools();

  return (
    <ToolsClient
      tools={data.tools}
      lastUpdated={data.last_updated}
      totalTools={data.total_tools}
    />
  );
}
